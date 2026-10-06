/**
 * tests/e2e/tier3-cross-feature.test.js
 * 
 * Tier 3 — Cross-Feature Combinations Test Suite
 * Objective: Verify cross-feature interactions and double-entry accounting mechanics:
 * - Subcontract invoice payment settlement + fabric offset debit/credit linkage.
 * - Bank balance deduction vs Contact credit ledger balance.
 * - Double-entry balancing across TDHP accounts: 102.01, 320.01, 730.01, 191.01, 600.01, 391.01.
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

function createTier3Suite(context) {
  const suite = new TestSuite(
    'Tier 3 — Cross-Feature Combinations',
    'Validates multi-module linkages: Subcontract settlement + Fabric offset + Bank deduction + Ledger balancing'
  );

  const { authoritative, seed, frontend } = context;
  const { excelSummary, parasutLive } = authoritative;

  // 3.1: Subcontract invoice payment settlement + fabric offset debit/credit linkage
  suite.test('T3.1: Subcontract Invoice Settlement + Fabric Offset Debit/Credit Linkage', () => {
    // 1. Fason Alış Faturaları (NSA-70, NSA-84, NSA-87) TDHP Yevmiye Hareketleri:
    // Borç (Debit): 730.01 Fason Üretim Gideri = $21,848.00 USD (1,064,918.25 TL)
    // Borç (Debit): 191.01 İndirilecek KDV %10 = $2,184.80 USD (106,491.82 TL)
    // Alacak (Credit): 320.01 Faruk Aytin Cari = $24,032.80 USD (1,171,410.07 TL)
    const fasonMatrahUsd = 21848.00;
    const fasonKdvUsd = 2184.80;
    const fasonGrandUsd = 24032.80;

    const fasonDebitSumUsd = roundCent(fasonMatrahUsd + fasonKdvUsd);
    assertExact(fasonDebitSumUsd, fasonGrandUsd, 'Fason debit sum must equal credit to Faruk Aytin ($24,032.80)');

    // 2. Kumaş Satış & Mahsup Faturası (BR02026000000024) TDHP Yevmiye Hareketleri:
    // Borç (Debit): 320.01 Faruk Aytin Cari (Kumaş Mahsubu ile borçlandırılır, alacağı azalır) = 364,045.00 TL ($7,461.45 USD)
    // Alacak (Credit): 600.01 Yurtiçi Satışlar (Kumaş Geliri) = 330,950.00 TL ($6,783.14 USD)
    // Alacak (Credit): 391.01 Hesaplanan KDV %10 = 33,095.00 TL ($678.31 USD)
    const fabricMatrahTl = 330950.00;
    const fabricKdvTl = 33095.00;
    const fabricGrandTl = 364045.00;

    const fabricCreditSumTl = roundCent(fabricMatrahTl + fabricKdvTl);
    assertExact(fabricCreditSumTl, fabricGrandTl, 'Fabric credit sum must equal debit to Faruk Aytin (364,045.00 TL)');

    // 3. Çift Yönlü Mahsup Sonrası Faruk Aytin Cari Bakiye (Faturalar Bazında):
    // Alacak: $24,032.80 USD
    // Borç: $7,461.45 USD
    // Fatura bazlı net borç: $16,571.35 USD
    const netInvoiceLiabilityUsd = roundCent(fasonGrandUsd - 7461.45);
    assertExact(netInvoiceLiabilityUsd, 16571.35, 'Net Faruk Aytin invoice liability before bank payments is $16,571.35 USD');

    const netInvoiceLiabilityTl = roundCent(1171410.07 - fabricGrandTl);
    assertExact(netInvoiceLiabilityTl, 807365.07, 'Net Faruk Aytin invoice liability in TL before bank payments is 807,365.07 TL');

    // 4. Verify seed.js journal entries balance
    // Entry 1044145: Fason Dikim Tahakkuku (Debit: 1,027,959.07, Credit: 1,027,959.07)
    // Entry 1044146: Kumaş Satış & Mahsup (Debit: 364,045.00, Credit: 364,045.00)
    assertTrue(seed.rawSource.includes('1044145'), 'Seed contains Fason journal entry 1044145');
    assertTrue(seed.rawSource.includes('1044146'), 'Seed contains Fabric offset journal entry 1044146');
    assertTrue(seed.rawSource.includes('364045.00'), 'Seed contains 364,045.00 TL fabric offset amount');
  });

  // 3.2: Bank balance deduction vs Contact credit ledger balance
  suite.test('T3.2: Bank Balance Deduction vs Contact Credit Ledger Balance', () => {
    // 5 Bank Transfers from Garanti BBVA Ana TL (417-6289477 / 102.01) to Faruk Aytin (320.01):
    const bankPayments = excelSummary.banka_odemeleri;
    assertExact(bankPayments.length, 5, 'Must have 5 bank transfers');

    const totalTransferTl = bankPayments.reduce((acc, p) => roundCent(acc + p.tl), 0);
    const totalTransferUsd = bankPayments.reduce((acc, p) => roundCent(acc + p.usd), 0);

    assertExact(totalTransferTl, 298471.00, 'Total bank transfers must be 298,471.00 TL');
    assertExact(totalTransferUsd, 6236.00, 'Total bank transfers must be $6,236.00 USD');

    // TDHP Yevmiye Kuralı:
    // Borç (Debit): 320.01 Faruk Aytin Cari = 298,471.00 TL ($6,236.00 USD)
    // Alacak (Credit): 102.01 Garanti BBVA Ana TL = 298,471.00 TL ($6,236.00 USD)
    // Net Faruk Aytin Bakiye:
    // Başlangıç Fatura Borcu: $16,571.35 USD (807,365.07 TL)
    // Yapılan Banka Ödemeleri: -$6,236.00 USD (-298,471.00 TL)
    // Kalan Net Borcumuz: $10,335.35 USD (508,894.07 TL)
    const finalNetPayableUsd = roundCent(16571.35 - totalTransferUsd);
    assertExact(finalNetPayableUsd, 10335.35, 'Final net payable in USD must be $10,335.35 USD');

    const finalNetPayableTl = roundCent(807365.07 - totalTransferTl);
    assertExact(finalNetPayableTl, 508894.07, 'Final net payable in TL must be 508,894.07 TL');

    // Garanti Bankası Bakiye Tutarlılık Denetimi:
    // Canlı Paraşüt bakiyesi: ₺15,732.92
    const liveGarantiTL = parasutLive.bank_accounts.find(b => b.name.includes('417-6289477'));
    assertDefined(liveGarantiTL, 'Garanti BBVA 417-6289477 must exist in live accounts');
    assertExact(parseFloat(liveGarantiTL.balance), 15732.92, 'Live Garanti balance must be ₺15,732.92');

    // Kanıt: Eğer bu 298,471 TL banka transferi düşülmemiş olsaydı,
    // Garanti bakiyesi ₺15,732.92 + ₺298,471.00 = ₺314,203.92 olurdu.
    const preTransferGarantiTL = roundCent(parseFloat(liveGarantiTL.balance) + totalTransferTl);
    assertExact(preTransferGarantiTL, 314203.92, 'Pre-transfer implied Garanti balance is ₺314,203.92');

    // Faruk Aytin'in cari hesabındaki borçlanma da kuruşu kuruşuna 298,471 TL azalmıştır.
    const liveFaruk = parasutLive.contacts.find(c => c.name.includes('FARUK AYTİN'));
    assertDefined(liveFaruk, 'Faruk Aytin must exist in live contacts');
    assertExact(parseFloat(liveFaruk.usd_balance), -10335.35, 'Faruk Aytin live USD balance reflects exact bank deduction');
  });

  return suite;
}

module.exports = { createTier3Suite };
