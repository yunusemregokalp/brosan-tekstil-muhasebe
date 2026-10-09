/**
 * BROSAN TEKSTİL ERP — PHASE 4 MILESTONE 1 (M1-2)
 * TURKISH COMMERCIAL & FALSE-POSITIVE STRESS TEST SUITE
 * 
 * Challenger M1-2: Turkish Commercial & False-Positive Stress Challenger
 * 
 * Evaluates server/heuristicWaf.js against 68+ authentic Turkish accounting sentences,
 * multi-currency amounts ($10.335,35 USD, €11.792,36 EUR, ₺15.732,92 TL),
 * complex invoice lines, textile specifications (30/2 Penye Süprem, 144 CM, 172 GSM),
 * and legitimate SQL/programming words without attack grammar ('seçim', 'veya', 'drop off', 'select box').
 * 
 * Requirement: 0% false-positive rate on all authentic commercial inputs.
 */

const assert = require('assert');
const http = require('http');
const express = require('express');

const {
  heuristicWafGuard,
  inspectPayload
} = require('../server/heuristicWaf');
const { quarantineEngine } = require('../server/quarantine');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

const TEST_CASES = [
  // ==============================================================================
  // CATEGORY 1: TURKISH ACCOUNTING & FINANCIAL SENTENCES (12 CASES)
  // ==============================================================================
  {
    id: 'ACC-01',
    category: 'Turkish Accounting',
    text: 'İş Bankası havale açıklaması: 1044145905 nolu fason dikiş faturası mahsubu'
  },
  {
    id: 'ACC-02',
    category: 'Turkish Accounting',
    text: 'Şirket VKN: 1871741946 (Beylikdüzü V.D.), Faruk Aytin & Nisa Tekstil kumaş teslimatı'
  },
  {
    id: 'ACC-03',
    category: 'Turkish Accounting',
    text: 'Garanti BBVA Bahçeşehir Şubesi döviz transferi, TCMB kur bildirim saatleri 11:00-15:00'
  },
  {
    id: 'ACC-04',
    category: 'Turkish Accounting',
    text: 'Tevkifatlı fatura beyanı: KDV Genel Tebliği uyarınca 5/10 oranında KDV tevkifatı uygulanmıştır'
  },
  {
    id: 'ACC-05',
    category: 'Turkish Accounting',
    text: 'Cari hesap mutabakat mektubu: 31.12.2025 tarihi itibarıyla firmamız nezdindeki bakiyeniz mutabıktır'
  },
  {
    id: 'ACC-06',
    category: 'Turkish Accounting',
    text: 'SGK Beylikdüzü Sosyal Güvenlik Merkezi 26 haneli işyeri sicil numarası ve 4/a sigortalı bildirgesi'
  },
  {
    id: 'ACC-07',
    category: 'Turkish Accounting',
    text: 'Muhtasar ve Prim Hizmet Beyannamesi (MUHSGK) damga vergisi ve tevkifata tabi ödemeler bildirimi'
  },
  {
    id: 'ACC-08',
    category: 'Turkish Accounting',
    text: 'Celalettin Soyuduru SMMM ofisi ile aylık mizan ve gelir tablosu konsolidasyonu tamamlandı'
  },
  {
    id: 'ACC-09',
    category: 'Turkish Accounting',
    text: 'İhracat Bedeli Kabul Belgesi (İBKB) Garanti BBVA nezdinde düzenlenmiş olup %40 TCMB devri yapılmıştır'
  },
  {
    id: 'ACC-10',
    category: 'Turkish Accounting',
    text: 'Mersis No: 0187174194600001, Ticaret Sicil No: 1095772, Vergi Levhası onaylı nüshası'
  },
  {
    id: 'ACC-11',
    category: 'Turkish Accounting',
    text: 'Çek bordrosu: Portföydeki 30.04.2026 vadeli çek tahsilata verilmek üzere bankaya teslim edildi'
  },
  {
    id: 'ACC-12',
    category: 'Turkish Accounting',
    text: 'Aytin Tekstil cari hesap mahsup fişi: Fason işçilik bedeli kumaş faturasından tenzil edilmiştir'
  },

  // ==============================================================================
  // CATEGORY 2: CURRENCY FORMATS & MULTI-CURRENCY EXPRESSIONS (10 CASES)
  // ==============================================================================
  {
    id: 'CURR-01',
    category: 'Currency Formats',
    text: '$10.335,35 USD'
  },
  {
    id: 'CURR-02',
    category: 'Currency Formats',
    text: '€11.792,36 EUR'
  },
  {
    id: 'CURR-03',
    category: 'Currency Formats',
    text: '₺15.732,92 TL'
  },
  {
    id: 'CURR-04',
    category: 'Currency Formats',
    text: '£22.414,22 GBP'
  },
  {
    id: 'CURR-05',
    category: 'Currency Formats',
    text: '-$10.335,35 USD net kalan borç tutarı (508.894,07 TL karşılığı)'
  },
  {
    id: 'CURR-06',
    category: 'Currency Formats',
    text: 'Garanti BBVA 417-9034580 nolu hesap bakiyesi: $1.521,16 USD döviz tevdiat'
  },
  {
    id: 'CURR-07',
    category: 'Currency Formats',
    text: 'İhracat bedeli transferi: 120.450,00 USD (Kur: 36,4500 TL = 4.390.352,50 TL)'
  },
  {
    id: 'CURR-08',
    category: 'Currency Formats',
    text: 'KDV Tutarı: €1.230,49 EUR, Net Ödenecek: €10.561,87 EUR'
  },
  {
    id: 'CURR-09',
    category: 'Currency Formats',
    text: 'Tevkifat Matrahı: 250.000,00 ₺, %20 KDV: 50.000,00 ₺, Alıcı Tevkifatı (5/10): 25.000,00 ₺'
  },
  {
    id: 'CURR-10',
    category: 'Currency Formats',
    text: 'CHF 4.500,75 İsviçre Frangı ve ¥250.000 JPY Japon Yeni kambiyo karşılıkları'
  },

  // ==============================================================================
  // CATEGORY 3: COMPLEX INVOICE LINES & DEDUCTIONS (10 CASES)
  // ==============================================================================
  {
    id: 'INV-01',
    category: 'Invoice Lines',
    text: 'Brosan Kumaş Satış Faturası No: BR02026000000024 ($7.461,45 USD / 364.045,00 TL)'
  },
  {
    id: 'INV-02',
    category: 'Invoice Lines',
    text: 'NSA-70, NSA-84, NSA-87 fason faturaları kumaş mahsubu tablosu'
  },
  {
    id: 'INV-03',
    category: 'Invoice Lines',
    text: '1. Kalite Penye Kumaş İmalatı - 2.500 Kg @ 4,25 USD/Kg = 10.625,00 USD + KDV'
  },
  {
    id: 'INV-04',
    category: 'Invoice Lines',
    text: 'Fason Dikim Hizmeti: 5.000 Adet Erkek T-Shirt Dikimi @ 22,50 TL/Adet = 112.500,00 TL'
  },
  {
    id: 'INV-05',
    category: 'Invoice Lines',
    text: 'İade Faturası: İAD202600000012 nolu fatura ile 120 Kg hatalı boyanmış kumaş iade edilmiştir'
  },
  {
    id: 'INV-06',
    category: 'Invoice Lines',
    text: 'İskonto ve Masraf: %3 Erken Ödeme İskontosu (-1.500,00 TL) + Navlun Bedeli (2.200,00 TL)'
  },
  {
    id: 'INV-07',
    category: 'Invoice Lines',
    text: 'Gümrük Çıkış Beyannamesi (ETGB) Tescil No: 26340500EX001248 (Ambar Giriş: 08.10.2026)'
  },
  {
    id: 'INV-08',
    category: 'Invoice Lines',
    text: 'Proforma Fatura Ref: PI-2026-BROSAN-889, Teslim Şekli: FOB İstanbul Limanı, Ödeme: %30 Peşin'
  },
  {
    id: 'INV-09',
    category: 'Invoice Lines',
    text: 'Navlun ve Sigorta: CIF Felixstowe Port, Navlun Faturası: TR-EXP-2026-903, Sigorta Poliçe: 88471'
  },
  {
    id: 'INV-10',
    category: 'Invoice Lines',
    text: 'Giriş Fişi: 1044145920 nolu irsaliyeli fatura ile depoya 45 top süprem kumaş girişi yapıldı'
  },

  // ==============================================================================
  // CATEGORY 4: TEXTILE SPECIFICATIONS & TECHNICAL DATA (12 CASES)
  // ==============================================================================
  {
    id: 'TEX-01',
    category: 'Textile Specs',
    text: '30/2 Penye Süprem, 144 CM, 172 GSM'
  },
  {
    id: 'TEX-02',
    category: 'Textile Specs',
    text: '30/1 Penye Süprem %100 Pamuk, En: 180 cm, Gramaj: 150 gr/m2, Renk: Optik Beyaz'
  },
  {
    id: 'TEX-03',
    category: 'Textile Specs',
    text: '20/1 Open End Hambez Kumaş, 160 CM En, 140 GSM, Ham Ekru'
  },
  {
    id: 'TEX-04',
    category: 'Textile Specs',
    text: '40/1 Viskon Likra Süprem Kumaş, En: 175 CM (+/- 2 cm), 190 GSM'
  },
  {
    id: 'TEX-05',
    category: 'Textile Specs',
    text: '24/1 Melanj İplik %50 Pamuk %50 Polyester, Bobin Ağırlığı: 2.15 Kg, Lot No: L-8472'
  },
  {
    id: 'TEX-06',
    category: 'Textile Specs',
    text: '30/2 Penye Kompakt İplik, Büküm: 780 Tur/m, Mukavemet: 18.5 cN/tex, Uster: %10.2'
  },
  {
    id: 'TEX-07',
    category: 'Textile Specs',
    text: '2/30 Akrilik Triko İpliği, Renk Kodu: #842 (PANTONE 19-4052 Classic Navy)'
  },
  {
    id: 'TEX-08',
    category: 'Textile Specs',
    text: 'Et Kefeni (Stockinette) Karkas Et Sarma Kumaşı 30 cm rulo, 4.5 kg/top, %100 Pamuklu Örme'
  },
  {
    id: 'TEX-09',
    category: 'Textile Specs',
    text: 'Koli Ebatları: 60x40x40 cm, Brüt Ağırlık: 24,5 kg, Net Ağırlık: 22,8 kg, Hacim: 0,096 CBM'
  },
  {
    id: 'TEX-10',
    category: 'Textile Specs',
    text: 'Ribana Kumaş 2x2 Likralı, En: 110 cm Tüp, Gramaj: 240 gr/m2, Çekmezlik: Boy %3 En %2'
  },
  {
    id: 'TEX-11',
    category: 'Textile Specs',
    text: 'İki İplik Şardonlu Kumaş, 30/1 - 10/1 Pamuk/Polyester, En: 185 cm, Gramaj: 280 GSM'
  },
  {
    id: 'TEX-12',
    category: 'Textile Specs',
    text: 'İnterlok Örme Kumaş, 40/1 Penye Pamuk, En: 160 cm, Gramaj: 210 GSM, Renk: Antrasit Melanj'
  },

  // ==============================================================================
  // CATEGORY 5: LEGITIMATE SQL/PROGRAMMING WORDS WITHOUT ATTACK GRAMMAR (14 CASES)
  // ==============================================================================
  {
    id: 'KEYW-01',
    category: 'Innocent Keywords',
    text: 'Seçim Kriteri: Kalite kontrol testinden geçen topların seçimi yapılmıştır'
  },
  {
    id: 'KEYW-02',
    category: 'Innocent Keywords',
    text: 'Ödeme yöntemi: Nakit veya banka havalesi ile ödeme kabul edilmektedir'
  },
  {
    id: 'KEYW-03',
    category: 'Innocent Keywords',
    text: 'Kargo teslimatı: Tahtakale şubesi drop off noktasına saat 16:00\'da teslim edildi'
  },
  {
    id: 'KEYW-04',
    category: 'Innocent Keywords',
    text: 'Arayüz formu: Departman alanındaki select box üzerinden Muhasebe seçiniz'
  },
  {
    id: 'KEYW-05',
    category: 'Innocent Keywords',
    text: 'Kumaş dokuma türü: Union kumaş pamuk ve keten karışımlı özel bir dokumadır'
  },
  {
    id: 'KEYW-06',
    category: 'Innocent Keywords',
    text: 'Ambalaj malzemesi: Koli içi insert karton seperatör desteği eklendi'
  },
  {
    id: 'KEYW-07',
    category: 'Innocent Keywords',
    text: 'Sistem güncellemesi: Fiyat listesi update edildi, yeni birim fiyatlar geçerlidir'
  },
  {
    id: 'KEYW-08',
    category: 'Innocent Keywords',
    text: 'Kayıt düzenleme: Yanlış girilen satır delete işlemi yapılmadan pasife alındı'
  },
  {
    id: 'KEYW-09',
    category: 'Innocent Keywords',
    text: 'Toplantı düzeni: Konferans salonundaki table düzeni misafirler için hazırlandı'
  },
  {
    id: 'KEYW-10',
    category: 'Innocent Keywords',
    text: 'Sevkiyat belgesi: From: Brosan Tekstil İstanbul To: Ben Ellis London UK'
  },
  {
    id: 'KEYW-11',
    category: 'Innocent Keywords',
    text: 'İhracat siparişi: Order confirmation PO-2026-994 onaylandı'
  },
  {
    id: 'KEYW-12',
    category: 'Innocent Keywords',
    text: 'Şirket organizasyonu: Brosan Group şirketler topluluğu yıllık faaliyet raporu'
  },
  {
    id: 'KEYW-13',
    category: 'Innocent Keywords',
    text: 'Ar-Ge çalışması: Research and development birimi yeni organik kumaş numunesi üretti'
  },
  {
    id: 'KEYW-14',
    category: 'Innocent Keywords',
    text: 'Tedarikçi listesi: Supplier database kayıtları ERP sistemine aktarılmıştır'
  },

  // ==============================================================================
  // CATEGORY 6: BOUNDARY PUNCTUATIONS, SEMICOLONS, ELLIPSES & MATH (10 CASES)
  // ==============================================================================
  {
    id: 'PUNC-01',
    category: 'Punctuation & Syntax',
    text: 'Brosan\'ın Garanti\'den Faruk\'a gönderdiği transfer dekontu ektedir'
  },
  {
    id: 'PUNC-02',
    category: 'Punctuation & Syntax',
    text: 'Fatura düzenlendi; vadesi 30 gün sonra dolacak; ödeme teyidi bekleniyor'
  },
  {
    id: 'PUNC-03',
    category: 'Punctuation & Syntax',
    text: 'İşlem özeti: Toplam = 15.000 TL, Masraf = 250 TL, Net = 14.750 TL'
  },
  {
    id: 'PUNC-04',
    category: 'Punctuation & Syntax',
    text: 'Kalan borç tutarı < 15.000 TL ve son ödeme tutarı > 5.000 TL olmalıdır'
  },
  {
    id: 'PUNC-05',
    category: 'Punctuation & Syntax',
    text: 'Tolerans sınırı: Gramaj farkı <= %3 ve en sapması >= -2 cm kabul edilir'
  },
  {
    id: 'PUNC-06',
    category: 'Punctuation & Syntax',
    text: 'Evrak incelemesi devam ediyor... Lütfen sonuçlanmasını bekleyiniz...'
  },
  {
    id: 'PUNC-07',
    category: 'Punctuation & Syntax',
    text: 'Atatürk Cad. No: 14/B Kat: 3 Daire: 5 Beylikdüzü / İstanbul'
  },
  {
    id: 'PUNC-08',
    category: 'Punctuation & Syntax',
    text: 'Firma Unvanı: Faruk Aytin & Nisa Tekstil Konfeksiyon San. Ltd. Şti.'
  },
  {
    id: 'PUNC-09',
    category: 'Punctuation & Syntax',
    text: 'Depo Sayımı: 1.500 Metre Hambez, 250 Kg Ribana Kumaş, 12 Koli İplik'
  },
  {
    id: 'PUNC-10',
    category: 'Punctuation & Syntax',
    text: 'Giriş/Çıkış Fişi No: F-2026-001 (Stoktan Düşüldü ve Fasona Sevk Edildi)'
  }
];

function sendHttpRequest({ hostname = '127.0.0.1', port, path = '/', method = 'POST', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path, method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, text: data, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTurkishCommercialStressSuite() {
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🇹🇷  BROSAN ERP — HEURISTIC WAF TURKISH COMMERCIAL & FALSE-POSITIVE STRESS SUITE${colors.reset}`);
  console.log(`${colors.dim}Challenger M1-2: Stress testing ${TEST_CASES.length} real-world Turkish commercial payloads...${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  // Spin up ephemeral test server
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Mount WAF
  app.use(heuristicWafGuard);

  // Endpoint
  app.post('/api/commercial-submit', (req, res) => {
    res.json({ ok: true, data: req.body });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  try {
    for (const testCase of TEST_CASES) {
      totalTests++;
      const clientIp = `203.0.113.${(totalTests % 200) + 10}`;
      quarantineEngine.unquarantineIp(clientIp);

      try {
        // Test 1: Direct inspectPayload check
        const directViolation = inspectPayload(testCase.text);
        if (directViolation) {
          throw new Error(`Direct inspection triggered: [${directViolation.ruleId}] ${directViolation.attackType} on matched "${directViolation.matchedSnippet}"`);
        }

        // Test 2: In-Flight HTTP Request with realistic payload structure
        const res = await sendHttpRequest({
          port,
          path: '/api/commercial-submit',
          method: 'POST',
          headers: {
            'host': 'brosangroup.com',
            'content-type': 'application/json',
            'x-forwarded-for': clientIp,
            'user-agent': 'TurkishCommercialTestHarness/1.0'
          },
          body: JSON.stringify({
            invoiceId: testCase.id,
            description: testCase.text,
            lineItems: [
              {
                spec: testCase.text,
                quantity: 100,
                unitPrice: 10.335
              }
            ],
            notes: testCase.text
          })
        });

        // Assert HTTP 200 OK
        assert.strictEqual(
          res.status,
          200,
          `Expected 200 OK but received HTTP ${res.status}: ${res.text}`
        );

        // Assert client IP was NOT quarantined
        const qCheck = quarantineEngine.isQuarantined(clientIp);
        assert.strictEqual(
          qCheck.quarantined,
          false,
          `Legitimate client IP ${clientIp} was wrongly quarantined!`
        );

        passedTests++;
        console.log(`  ${colors.green}✔ PASS${colors.reset} [${testCase.id}] (${testCase.category}) "${testCase.text.slice(0, 48)}..."`);
      } catch (err) {
        failedTests++;
        failures.push({
          id: testCase.id,
          category: testCase.category,
          text: testCase.text,
          error: err.message
        });
        console.error(`  ${colors.red}✖ FAIL${colors.reset} [${testCase.id}] (${testCase.category}) False Positive: ${err.message}`);
      } finally {
        quarantineEngine.unquarantineIp(clientIp);
      }
    }
  } finally {
    server.close();
  }

  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}SUMMARY RESULTS: ${passedTests}/${totalTests} PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)${colors.reset}`);
  if (failedTests > 0) {
    console.log(`${colors.bold}${colors.red}FALSE POSITIVE RATE: ${((failedTests / totalTests) * 100).toFixed(2)}% (${failedTests} false positives)${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.green}FALSE POSITIVE RATE: 0.00% (ZERO FALSE POSITIVES DETECTED)${colors.reset}`);
  }
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  return { totalTests, passedTests, failedTests, failures };
}

module.exports = { runTurkishCommercialStressSuite, TEST_CASES };

if (require.main === module) {
  runTurkishCommercialStressSuite()
    .then(result => {
      if (result.failedTests > 0) {
        console.error(`FATAL: ${result.failedTests} false positive(s) detected. Exiting with code 1.`);
        process.exit(1);
      } else {
        console.log('SUCCESS: All Turkish commercial payloads passed without false positives.');
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
