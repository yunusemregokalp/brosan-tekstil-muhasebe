const { inspectPayload } = require('../server/heuristicWaf');

const extendedCommercialCases = [
  { id: 'EXT-01', text: 'Tarih formatları: 09/10/2026 veya 09.10.2026 veya 2026-10-09' },
  { id: 'EXT-02', text: 'Telefon: +90 530 060 83 66 veya 0 (212) 875 00 00 (Dahili: 104)' },
  { id: 'EXT-03', text: 'E-Posta: emre@brosantextile.com ve muhasebe@brosangroup.com' },
  { id: 'EXT-04', text: 'Web sitesi: https://brosangroup.com/muhasebe/fatura/detay' },
  { id: 'EXT-05', text: 'IBAN: TR45 0006 2000 0001 2345 6789 01 (Garanti BBVA)' },
  { id: 'EXT-06', text: 'Firma adı tırnak içinde: "Brosan Tekstil San. ve Tic. Ltd. Şti."' },
  { id: 'EXT-07', text: 'Tek tırnaklı Türkçe iyelik eki: Brosan\'ın Garanti\'deki hesabından transfer' },
  { id: 'EXT-08', text: 'Parantezli Türkçe açıklama: (Kumaş bedeli düşüldükten sonra kalan net tutar)' },
  { id: 'EXT-09', text: 'Yüzde ve bölme: %20 KDV, %10 stopaj, 5/10 tevkifat payı' },
  { id: 'EXT-10', text: 'Eşittir ve matematik: 100 Adet * 45,50 TL = 4.550,00 TL + KDV' },
  { id: 'EXT-11', text: 'İki nokta ve noktalı virgül: Açıklama: Fason dikim; Termin: 15 gün; Durum: Tamamlandı' },
  { id: 'EXT-12', text: 'Tekstil karışım: %50 Pamuk / %50 Polyester 30/1 Süprem Kumaş' },
  { id: 'EXT-13', text: 'Gümrük GTİP Kodu: 6006.22.00.00.00 Boyanmış pamuklu diğer örme kumaşlar' },
  { id: 'EXT-14', text: 'İrsaliye no ve seri: İRS-2026-000458 / Sıra No: 12' },
  { id: 'EXT-15', text: 'Adres kısaltmaları: No: 15/4 Kat: 2 Beylikdüzü OSB / İst.' }
];

console.log('--- Testing Extended Commercial Cases ---');
let pass = 0, fail = 0;
extendedCommercialCases.forEach(tc => {
  const v = inspectPayload(tc.text);
  if (v) {
    fail++;
    console.log(`[FAIL] ${tc.id}: ${v.ruleId} -> ${tc.text}`);
  } else {
    pass++;
    console.log(`[PASS] ${tc.id}: ${tc.text}`);
  }
});
console.log(`\nResult: ${pass}/${extendedCommercialCases.length} Passed, ${fail} Failed`);
