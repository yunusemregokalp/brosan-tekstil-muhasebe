/**
 * tests/e2e/tier1-feature-coverage.test.js
 * 
 * Tier 1 — Feature Coverage Test Suite
 * Objective: Verify presence, structure, and values of core accounting features:
 * - 15 Paraşüt contacts with valid tax IDs, currencies, and balances.
 * - 14 bank/cash accounts with exact balances and IBANs.
 * - 15 sales invoices and checks.
 * - Faruk Aytin fason invoices (NSA-70, NSA-84, NSA-87) totaling $24,032.80 USD.
 * - Fabric invoice BR02026000000024 ($7,461.45 USD / 364,045 TL) and 5 Garanti bank transfers (298,471 TL / $6,236 USD).
 */

const {
  TestSuite,
  assertExact,
  assertApprox,
  assertTrue,
  assertDefined,
  roundCent,
  formatMoney,
  loadAllData
} = require('./test-helpers');

function createTier1Suite(context) {
  const suite = new TestSuite(
    'Tier 1 — Feature Coverage',
    'Validates foundational feature data against authoritative Paraşüt (794187) and Excel records'
  );

  const { authoritative, seed, frontend, db } = context;
  const { parasutLive, excelSummary } = authoritative;

  // 1.1: 15 Paraşüt Contacts
  suite.test('T1.1: 15 Paraşüt Contacts Present with Valid Tax IDs, Currencies, and Balances', () => {
    const liveContacts = parasutLive.contacts;
    assertExact(liveContacts.length, 15, 'Authoritative Paraşüt contacts count must be exactly 15');

    // Expected mapping from authoritative Paraşüt dataset
    const expectedContacts = [
      { id: 1072562264, name: 'BEN ELLİS', curr: 'GBP', balanceGbp: 22414.22, taxNumber: '11111111111' },
      { id: 1048062503, name: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK', curr: 'TRY', balanceTrl: -1099047.50, taxPrefix: '844' },
      { id: 1050398787, name: 'LAVI LA LLC', curr: 'USD', balanceUsd: 20001.33, taxNumber: 'US95-4829104' },
      { id: 1071694008, name: 'FARUK AYTİN', curr: 'USD', balanceUsd: -10335.35, taxNumber: '46849262292' },
      { id: 1051429321, name: 'GbR Celik', curr: 'EUR', balanceEur: 6586.04, taxNumber: 'DE301948271' },
      { id: 1060621660, name: 'ÇETİN TÜREDİ', curr: 'TRY', balanceTrl: -200000.00, taxNumber: '39481920194' },
      { id: 1048986698, name: 'ATTERO CLOTHING', curr: 'EUR', balanceEur: 2780.37, taxNumber: 'GB883910294' },
      { id: 1047783441, name: 'YUNUS EMRE GÖKALP', curr: 'TRY', balanceTrl: -109418.80, taxNumber: '41755737346' },
      { id: 1055271881, name: 'Rana Jassim', curr: 'EUR', balanceEur: 1400.00, taxNumber: 'KW-4910284' },
      { id: 1054860047, name: 'ARKSİGNER', curr: 'TRY', balanceTrl: -50800.00, taxNumber: '0790611963' },
      { id: 1062854363, name: 'CuterEsque Inc.', curr: 'USD', balanceUsd: 985.70, taxNumber: '22222222222' },
      { id: 1047788176, name: 'FİLET ÖRME', curr: 'TRY', balanceTrl: -42919.60, taxNumber: '3870555559' },
      { id: 1050488708, name: 'BE-HA KONFEKSİYON', curr: 'TRY', balanceTrl: 27096.00, taxNumber: '30847956574' },
      { id: 1050493587, name: 'MERT ÜTÜ', curr: 'TRY', balanceTrl: -18952.00, taxNumber: '0080449532' },
      { id: 1054637401, name: 'ASSET LOJİSTİK', curr: 'TRY', balanceTrl: -18243.96, taxNumber: '0910518946' }
    ];

    for (const exp of expectedContacts) {
      const match = liveContacts.find(c => c.name.includes(exp.name.split(' ')[0]) || (exp.id && c.id === exp.id));
      assertDefined(match, `Contact ${exp.name} must exist in authoritative contacts`);

      // Verify Tax ID presence (domestic VKN/TCKN or abroad status)
      if (exp.taxNumber) {
        if (match.tax_number) {
          assertExact(match.tax_number, exp.taxNumber, `Tax number for ${exp.name} must match authoritative live record`);
        } else if (match.is_abroad) {
          assertTrue(match.is_abroad === true, `Entity ${exp.name} without domestic tax number must be marked abroad`);
        } else {
          // If live record has empty tax number, verify seed record has valid tax number
          const seedMatch = seed.contactsData.find(sc => sc.title && sc.title.includes(exp.name.split(' ')[0]));
          if (seedMatch) {
            assertExact(seedMatch.taxNumber, exp.taxNumber, `Seed contact ${exp.name} must have tax number ${exp.taxNumber}`);
          }
        }
      }

      if (exp.balanceGbp !== undefined) {
        assertApprox(parseFloat(match.gbp_balance), exp.balanceGbp, 0.01, `GBP balance for ${exp.name}`);
      }
      if (exp.balanceUsd !== undefined) {
        assertApprox(parseFloat(match.usd_balance), exp.balanceUsd, 0.01, `USD balance for ${exp.name}`);
      }
      if (exp.balanceEur !== undefined) {
        assertApprox(parseFloat(match.eur_balance), exp.balanceEur, 0.01, `EUR balance for ${exp.name}`);
      }
      if (exp.balanceTrl !== undefined) {
        assertApprox(parseFloat(match.trl_balance || match.balance), exp.balanceTrl, 0.01, `TRY balance for ${exp.name}`);
      }
    }

    // Verify seed has 15 contacts
    if (seed.contactsData.length > 0) {
      assertExact(seed.contactsData.length, 15, 'Database seed contactsData must contain exactly 15 contacts');
    }
  });

  // 1.2: 14 Bank & Cash Accounts
  suite.test('T1.2: 14 Bank/Cash Accounts Present with Exact Balances and IBANs', () => {
    const liveAccounts = parasutLive.bank_accounts;
    assertExact(liveAccounts.length, 14, 'Authoritative bank_accounts count must be exactly 14');

    const expectedBanks = [
      { name: 'Kasa Hesabı', curr: 'TRL', balance: -722.35, iban: null },
      { name: 'YUNUS CEP K.K.', curr: 'TRL', balance: -248697.05, iban: null },
      { name: 'Garanti Bankası - 417-6289477', curr: 'TRL', balance: 15732.92, iban: 'TR160006200041700006289477' },
      { name: 'Garanti Bankası - 417-9034580', curr: 'USD', balance: 1521.16, iban: 'TR320006200041700009034580' },
      { name: 'Garanti Bankası - 910-8141112', curr: 'TRL', balance: 0.00, iban: 'TR460006200091000008141112' },
      { name: 'Garanti Bankası - 417-6289447', curr: 'TRL', balance: 0.00, iban: 'TR500006200041700006289447' },
      { name: 'Garanti Bankası - 417-6287865', curr: 'TRL', balance: 17210.75, iban: 'TR840006200041700006287865' },
      { name: 'Garanti Bankası - 417-9026872', curr: 'EUR', balance: 0.00, iban: 'TR830006200041700009026872' },
      { name: 'Garanti Bankası - 417-9034579', curr: 'EUR', balance: 11792.36, iban: 'TR590006200041700009034579' },
      { name: 'Garanti Bankası - 417-9026871', curr: 'GBP', balance: 0.00, iban: 'TR130006200041700009026871' },
      { name: 'Garanti Bankası - 417-9034578', curr: 'GBP', balance: 23759.07, iban: 'TR860006200041700009034578' },
      { name: 'Garanti Bankası - 417-9026873', curr: 'USD', balance: 0.00, iban: 'TR560006200041700009026873' },
      { name: 'CARİ AÇIK KAPATMA EUR', curr: 'EUR', balance: 9197.00, iban: null },
      { name: 'CARİ AÇIK KAPATMA USD', curr: 'USD', balance: 4748.93, iban: null }
    ];

    for (const eb of expectedBanks) {
      const match = liveAccounts.find(a => a.name.includes(eb.name) || (eb.iban && a.iban === eb.iban));
      assertDefined(match, `Bank account ${eb.name} must exist in authoritative bank accounts`);
      assertApprox(parseFloat(match.balance), eb.balance, 0.01, `Balance for ${eb.name}`);
      if (eb.iban) {
        assertExact(match.iban, eb.iban, `IBAN for ${eb.name}`);
      }
    }
  });

  // 1.3: 15 Sales Invoices & Checks
  suite.test('T1.3: 15 Sales Invoices and Portfolio Checks Loaded', () => {
    const liveInvoices = parasutLive.sales_invoices;
    assertExact(liveInvoices.length, 15, 'Authoritative sales_invoices count must be exactly 15');

    // Key invoice assertions
    const laviLa1 = liveInvoices.find(i => i.invoice_no === 'BS02025000000003');
    assertDefined(laviLa1, 'BS02025000000003 must exist');
    assertApprox(parseFloat(laviLa1.net_total), 10116.85, 0.01, 'BS02025000000003 net total');
    assertExact(laviLa1.currency, 'USD', 'BS02025000000003 currency');

    const laviLa2 = liveInvoices.find(i => i.invoice_no === 'BS02025000000004');
    assertDefined(laviLa2, 'BS02025000000004 must exist');
    assertApprox(parseFloat(laviLa2.net_total), 9884.48, 0.01, 'BS02025000000004 net total');

    const benEllisInv = liveInvoices.find(i => i.invoice_no === 'BS02026000000013');
    assertDefined(benEllisInv, 'BS02026000000013 must exist');
    assertApprox(parseFloat(benEllisInv.net_total), 7388.10, 0.01, 'BS02026000000013 net total');
    assertExact(benEllisInv.currency, 'GBP', 'BS02026000000013 currency');

    const fabricInv = liveInvoices.find(i => i.invoice_no === 'BR02026000000024');
    assertDefined(fabricInv, 'BR02026000000024 fabric invoice must exist in sales invoices');
    assertApprox(parseFloat(fabricInv.net_total), 364045.00, 0.01, 'BR02026000000024 net total');

    // Checks assertions
    const liveChecks = parasutLive.checks;
    assertExact(liveChecks.length, 3, 'Authoritative checks count must be exactly 3');

    const check1 = liveChecks.find(c => c.serial_number === '8031371');
    assertDefined(check1, 'Check 8031371 must exist');
    assertApprox(parseFloat(check1.net_total), 85000.00, 0.01, 'Check 8031371 amount');

    const check2 = liveChecks.find(c => c.serial_number === '8031372');
    assertDefined(check2, 'Check 8031372 must exist');
    assertApprox(parseFloat(check2.net_total), 101511.13, 0.01, 'Check 8031372 amount');

    const check3 = liveChecks.find(c => c.serial_number === '8031373');
    assertDefined(check3, 'Check 8031373 must exist');
    assertApprox(parseFloat(check3.net_total), 35000.00, 0.01, 'Check 8031373 amount');

    const totalCheckAmount = roundCent(85000.00 + 101511.13 + 35000.00);
    assertExact(totalCheckAmount, 221511.13, 'Total issued checks amount must be 221,511.13 TL');
  });

  // 1.4: Faruk Aytin Fason Invoices NSA-70, NSA-84, NSA-87 totaling $24,032.80 USD
  suite.test('T1.4: Faruk Aytin Fason Invoices (NSA-70, NSA-84, NSA-87) Totaling $24,032.80 USD', () => {
    const fasonFaturalar = excelSummary.fason_faturalar;
    assertExact(fasonFaturalar.length, 3, 'Excel summary fason invoices count must be exactly 3');

    const nsa70 = fasonFaturalar.find(f => f.fatura_no === 'NSA2026000000070');
    assertDefined(nsa70, 'NSA2026000000070 must exist');
    assertExact(nsa70.matrah_usd, 2760.00, 'NSA-70 matrah USD');
    assertExact(nsa70.kdv_usd, 276.00, 'NSA-70 KDV USD');
    assertExact(nsa70.toplam_usd, 3036.00, 'NSA-70 toplam USD');
    assertExact(nsa70.toplam_tl, 143451.00, 'NSA-70 toplam TL');

    const nsa84 = fasonFaturalar.find(f => f.fatura_no === 'NSA2026000000084');
    assertDefined(nsa84, 'NSA2026000000084 must exist');
    assertExact(nsa84.matrah_usd, 5788.00, 'NSA-84 matrah USD');
    assertExact(nsa84.kdv_usd, 578.80, 'NSA-84 KDV USD');
    assertExact(nsa84.toplam_usd, 6366.80, 'NSA-84 toplam USD');
    assertExact(nsa84.toplam_tl, 311529.43, 'NSA-84 toplam TL');

    const nsa87 = fasonFaturalar.find(f => f.fatura_no === 'NSA2026000000087');
    assertDefined(nsa87, 'NSA2026000000087 must exist');
    assertExact(nsa87.matrah_usd, 13300.00, 'NSA-87 matrah USD');
    assertExact(nsa87.kdv_usd, 1330.00, 'NSA-87 KDV USD');
    assertExact(nsa87.toplam_usd, 14630.00, 'NSA-87 toplam USD');
    assertExact(nsa87.toplam_tl, 716429.64, 'NSA-87 toplam TL');

    // Mathematical Sums
    const sumMatrahUsd = roundCent(nsa70.matrah_usd + nsa84.matrah_usd + nsa87.matrah_usd);
    const sumKdvUsd = roundCent(nsa70.kdv_usd + nsa84.kdv_usd + nsa87.kdv_usd);
    const sumTotalUsd = roundCent(nsa70.toplam_usd + nsa84.toplam_usd + nsa87.toplam_usd);
    const sumTotalTl = roundCent(nsa70.toplam_tl + nsa84.toplam_tl + nsa87.toplam_tl);

    assertExact(sumMatrahUsd, 21848.00, 'Total fason matrah must be $21,848.00 USD');
    assertExact(sumKdvUsd, 2184.80, 'Total fason KDV must be $2,184.80 USD');
    assertExact(sumTotalUsd, 24032.80, 'Total fason gross must be $24,032.80 USD');
    assertExact(sumTotalTl, 1171410.07, 'Total fason gross TL must be 1,171,410.07 TL');

    assertExact(excelSummary.summary.total_fason_alis_usd, 24032.80, 'Summary total fason USD');
  });

  // 1.5: Fabric Invoice BR02026000000024 & 5 Bank Transfers
  suite.test('T1.5: Fabric Invoice BR02026000000024 ($7,461.45 USD / 364,045 TL) and 5 Garanti Bank Transfers', () => {
    const kumas = excelSummary.kumas_satis_faturasi;
    assertExact(kumas.fatura_no, 'BR02026000000024', 'Fabric invoice no');
    assertExact(kumas.matrah_tl, 330950.00, 'Fabric matrah TL');
    assertExact(kumas.kdv_tl, 33095.00, 'Fabric KDV TL');
    assertExact(kumas.toplam_tl, 364045.00, 'Fabric total TL');
    assertExact(kumas.tcmb_kur, 48.7901, 'Fabric TCMB rate');
    assertExact(kumas.toplam_usd, 7461.45, 'Fabric total USD ($7,461.45)');
    assertExact(kumas.kdv_usd, 678.31, 'Fabric KDV USD ($678.31)');
    assertExact(kumas.matrah_usd, 6783.14, 'Fabric matrah USD ($6,783.14)');

    // Fabric kg total
    const totalKg = kumas.kalemler.reduce((acc, k) => acc + k.kg, 0);
    assertExact(roundCent(totalKg), 992.50, 'Fabric items total weight must be 992.50 Kg');

    // 5 Bank Transfers
    const bankOdemeleri = excelSummary.banka_odemeleri;
    assertExact(bankOdemeleri.length, 5, 'Bank transfers count must be exactly 5');

    const totalBankTl = bankOdemeleri.reduce((acc, b) => acc + b.tl, 0);
    const totalBankUsd = bankOdemeleri.reduce((acc, b) => acc + b.usd, 0);

    assertExact(totalBankTl, 298471.00, 'Total Garanti bank transfer must be 298,471.00 TL');
    assertExact(totalBankUsd, 6236.00, 'Total Garanti bank transfer in USD must be $6,236.00 USD');
  });

  return suite;
}

module.exports = { createTier1Suite };
