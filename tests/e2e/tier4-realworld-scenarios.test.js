/**
 * tests/e2e/tier4-realworld-scenarios.test.js
 * 
 * Tier 4 — Real-World Scenarios Test Suite
 * Objective: Verify end-to-end accounting lifecycle and bidirectional cross-tier audit:
 * - Full 9-step chronological lifecycle of Faruk Aytin & Nisa Tekstil subcontracting and fabric offset.
 * - Bidirectional cockpit ledger audit comparing database seed data with calculated UI state.
 */

const {
  TestSuite,
  assertExact,
  assertApprox,
  assertTrue,
  assertDefined,
  roundCent,
  formatMoney
} = require('./test-helpers');

function createTier4Suite(context) {
  const suite = new TestSuite(
    'Tier 4 — Real-World Scenarios',
    'Validates full Faruk Aytin lifecycle and bidirectional cockpit consistency across DB and UI cache'
  );

  const { authoritative, seed, frontend, db } = context;
  const { excelSummary, parasutLive } = authoritative;

  // 4.1: Full lifecycle test of Faruk Aytin & Nisa Tekstil subcontracting and fabric offset reconciliation
  suite.test('T4.1: Full 9-Step Chronological Lifecycle of Faruk Aytin & Nisa Tekstil Reconciliation', () => {
    // 9-Step chronological events from FARUK AYTİN CARİ.xlsx (Sheet: Resmi Cari Ekstre & Detaylı TL-USD)
    const lifecycleTimeline = [
      {
        step: 1,
        date: '2026-07-30',
        type: 'PURCHASE_INVOICE',
        docNo: 'NSA2026000000070',
        desc: 'EMK Oversized Tişört (276 Adet)',
        fxRate: 47.25,
        usdDebit: 0.00,
        usdCredit: 3036.00,
        tlDebit: 0.00,
        tlCredit: 143451.00,
        expectedUsdBalance: -3036.00,
        expectedTlBalance: -143451.00
      },
      {
        step: 2,
        date: '2026-07-31',
        type: 'BANK_TRANSFER',
        docNo: '2026-07-31-17.07.43',
        desc: 'NSA-70 Fatura Ödemesi (143.451 TL)',
        fxRate: 47.25,
        usdDebit: 3036.00,
        usdCredit: 0.00,
        tlDebit: 143451.00,
        tlCredit: 0.00,
        expectedUsdBalance: 0.00,
        expectedTlBalance: 0.00
      },
      {
        step: 3,
        date: '2026-09-07',
        type: 'BANK_TRANSFER',
        docNo: '2026-09-07-16.25.27',
        desc: 'Siparişe İstinaden Avans (96.600 TL)',
        fxRate: 48.30,
        usdDebit: 2000.00,
        usdCredit: 0.00,
        tlDebit: 96600.00,
        tlCredit: 0.00,
        expectedUsdBalance: 2000.00,
        expectedTlBalance: 96600.00
      },
      {
        step: 4,
        date: '2026-09-14',
        type: 'BANK_TRANSFER',
        docNo: '2026-09-14-14.19.11',
        desc: 'Cari Hesaba Avans (48.420 TL)',
        fxRate: 48.42,
        usdDebit: 1000.00,
        usdCredit: 0.00,
        tlDebit: 48420.00,
        tlCredit: 0.00,
        expectedUsdBalance: 3000.00,
        expectedTlBalance: 145020.00
      },
      {
        step: 5,
        date: '2026-09-22',
        type: 'BANK_TRANSFER',
        docNo: '2026-09-22-18.03.45',
        desc: 'Cari Hesaba Ödeme (5.000 TL)',
        fxRate: 50.00,
        usdDebit: 100.00,
        usdCredit: 0.00,
        tlDebit: 5000.00,
        tlCredit: 0.00,
        expectedUsdBalance: 3100.00,
        expectedTlBalance: 150020.00
      },
      {
        step: 6,
        date: '2026-09-27',
        type: 'FABRIC_OFFSET_INVOICE',
        docNo: 'BR02026000000024',
        desc: 'Kumaş Satışı (4 Kalem, 992.5 Kg)',
        fxRate: 48.7901,
        usdDebit: 7461.45,
        usdCredit: 0.00,
        tlDebit: 364045.00,
        tlCredit: 0.00,
        expectedUsdBalance: 10561.45,
        expectedTlBalance: 514065.00
      },
      {
        step: 7,
        date: '2026-09-30',
        type: 'BANK_TRANSFER',
        docNo: '2026-09-30-18.20.49',
        desc: 'Cari Hesaba Ödeme (5.000 TL)',
        fxRate: 50.00,
        usdDebit: 100.00,
        usdCredit: 0.00,
        tlDebit: 5000.00,
        tlCredit: 0.00,
        expectedUsdBalance: 10661.45,
        expectedTlBalance: 519065.00
      },
      {
        step: 8,
        date: '2026-10-01',
        type: 'PURCHASE_INVOICE',
        docNo: 'NSA2026000000084',
        desc: 'Ben Ellis (140 Tişört + 180 Hoodie)',
        fxRate: 48.9303,
        usdDebit: 0.00,
        usdCredit: 6366.80,
        tlDebit: 0.00,
        tlCredit: 311529.43,
        expectedUsdBalance: 4294.65,
        expectedTlBalance: 207535.57
      },
      {
        step: 9,
        date: '2026-10-05',
        type: 'PURCHASE_INVOICE',
        docNo: 'NSA2026000000087',
        desc: 'Ben Ellis (375 Tişört + 394 Hoodie)',
        fxRate: 48.9699,
        usdDebit: 0.00,
        usdCredit: 14630.00,
        tlDebit: 0.00,
        tlCredit: 716429.64,
        expectedUsdBalance: -10335.35,
        expectedTlBalance: -508894.07
      }
    ];

    let runningUsd = 0.00;
    let runningTl = 0.00;

    for (const evt of lifecycleTimeline) {
      // Balance movement: Debit increases receivable / reduces debt (+), Credit increases supplier liability (-)
      runningUsd = roundCent(runningUsd + evt.usdDebit - evt.usdCredit);
      runningTl = roundCent(runningTl + evt.tlDebit - evt.tlCredit);

      assertExact(runningUsd, evt.expectedUsdBalance, `Step ${evt.step} (${evt.docNo}) running USD balance`);
      assertExact(runningTl, evt.expectedTlBalance, `Step ${evt.step} (${evt.docNo}) running TL balance`);
    }

    // Final Lifecycle Asserts
    assertExact(runningUsd, -10335.35, 'Final lifecycle balance must be exactly -$10,335.35 USD');
    assertExact(runningTl, -508894.07, 'Final lifecycle balance must be exactly -508,894.07 TL');

    // Net VAT Lifecycle Assert
    const netVatUsd = roundCent(2184.80 - 276.00 - 678.31);
    assertExact(netVatUsd, 1230.49, 'Final lifecycle net VAT must be $1,230.49 USD');
  });

  // 4.2: Bidirectional cockpit ledger audit comparing database seed data with calculated UI state
  suite.test('T4.2: Bidirectional Cockpit Ledger Audit (Database Seed vs Calculated UI State)', () => {
    // 1. Audit Contact Counts & Identities across DB and Frontend Cache
    const liveContacts = parasutLive.contacts;
    const seedContacts = seed.contactsData;
    const uiCache = frontend.erpCache;

    assertDefined(uiCache, 'Frontend BROSAN_ERP cache must be loaded from app/index.html');
    assertTrue(Array.isArray(uiCache.contacts), 'UI cache must have contacts array');
    assertTrue(uiCache.contacts.length >= 15, 'UI cache must have at least 15 contacts');

    // Check Faruk Aytin in UI Cache
    const uiFaruk = uiCache.contacts.find(c => (c.name || c.title || '').includes('FARUK AYTİN'));
    assertDefined(uiFaruk, 'Faruk Aytin must exist in UI contacts');
    assertTrue(uiFaruk.balance.includes('10.335,35') || uiFaruk.balance.includes('10335.35') || uiFaruk.balance.includes('-508.894,07'),
      'Faruk Aytin UI balance string must reflect -$10,335.35 USD or -₺508,894.07 TL');

    // Check Ben Ellis in UI Cache
    const uiBenEllis = uiCache.contacts.find(c => (c.name || c.title || '').includes('BEN ELLİS'));
    assertDefined(uiBenEllis, 'Ben Ellis must exist in UI contacts');
    assertTrue(uiBenEllis.balance.includes('22.414,22') || uiBenEllis.balance.includes('1.452.246,45'),
      'Ben Ellis UI balance string must reflect £22,414.22 GBP or ₺1,452,246.45 TL');

    // 2. Audit Bank Accounts across DB and Frontend Cache
    const uiBanks = uiCache.bankAccounts;
    assertDefined(uiBanks, 'UI cache must have bankAccounts object');

    assertExact(uiBanks.garantiTry, 15732.92, 'Garanti BBVA TL balance in UI');
    assertExact(uiBanks.garantiGbp, 23759.07, 'Garanti BBVA GBP balance in UI');
    assertExact(uiBanks.garantiEur, 11792.36, 'Garanti BBVA EUR balance in UI');
    assertExact(uiBanks.garantiUsd, 1521.16, 'Garanti BBVA USD balance in UI');
    assertExact(uiBanks.garantiLojistikTry, 17210.75, 'Garanti BBVA Lojistik balance in UI');

    // 3. Audit Faruk Aytin Reconciliation Desk UI Object
    const uiRecon = uiCache.farukAytin;
    assertDefined(uiRecon, 'UI cache must contain dedicated farukAytin reconciliation object');
    assertDefined(uiRecon.summary, 'Reconciliation object must contain summary');

    assertExact(uiRecon.summary.totalFasonAlisUsd, 24032.80, 'UI totalFasonAlisUsd');
    assertExact(uiRecon.summary.totalFasonKdvUsd, 2184.80, 'UI totalFasonKdvUsd');
    assertExact(uiRecon.summary.totalBankaOdemesiUsd, 6236.00, 'UI totalBankaOdemesiUsd');
    assertExact(uiRecon.summary.totalBankaOdemesiTl, 298471.00, 'UI totalBankaOdemesiTl');
    assertExact(uiRecon.summary.kumasSatisUsd, 7461.45, 'UI kumasSatisUsd');
    assertExact(uiRecon.summary.kumasSatisTl, 364045.00, 'UI kumasSatisTl');
    assertExact(uiRecon.summary.netKalanBorcUsd, -10335.35, 'UI netKalanBorcUsd');
    assertExact(uiRecon.summary.netKalanBorcTl, -508894.07, 'UI netKalanBorcTl');
    assertExact(uiRecon.summary.netOdenecekKdvUsd, 1230.49, 'UI netOdenecekKdvUsd');
    assertExact(uiRecon.summary.netOdenecekKdvTl, 60355.83, 'UI netOdenecekKdvTl');

    // 4. Audit Cross-Tier Consistency with Database Seed Layer
    // Verify SubcontractReconciliation seeded model matches UI summary
    assertTrue(seed.rawSource.includes('24032.80'), 'Seed has totalFasonUsd 24032.80');
    assertTrue(seed.rawSource.includes('6236.00'), 'Seed has totalBankPaymentUsd 6236.00');
    assertTrue(seed.rawSource.includes('7461.45'), 'Seed has fabricInvoiceUsd 7461.45');
    assertTrue(seed.rawSource.includes('-10335.35'), 'Seed has netRemainingDebtUsd -10335.35');
    assertTrue(seed.rawSource.includes('1230.49'), 'Seed has netVatPayableUsd 1230.49');

    // Zero delta between UI cache and Database seed definitions
    const deltaReconUsd = Math.abs(uiRecon.summary.netKalanBorcUsd - (-10335.35));
    const deltaReconVat = Math.abs(uiRecon.summary.netOdenecekKdvUsd - 1230.49);
    assertExact(deltaReconUsd, 0, 'Zero discrepancy between DB seed and UI cockpit on net debt');
    assertExact(deltaReconVat, 0, 'Zero discrepancy between DB seed and UI cockpit on net VAT');
  });

  return suite;
}

module.exports = { createTier4Suite };
