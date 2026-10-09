const { inspectPayload } = require('../server/heuristicWaf');

const edgeCases = [
  { desc: 'Parenthesis followed by hash', text: 'Parti (Brosan) #1044' },
  { desc: 'Parenthesis followed by hash EFT', text: 'İşlem (EFT) #9948' },
  { desc: 'Single quote hex color', text: "Renk kodu: '#842'" },
  { desc: 'Double quote hex color', text: 'Kumaş: "#FFFFFF" beyaz' },
  { desc: 'Parenthesis followed by double dash', text: 'Sipariş (1. Kısım) -- depoya teslim' },
  { desc: 'Parenthesis followed by double dash payment', text: 'Fatura açıklaması: (Ödeme) -- Yapıldı' },
  { desc: 'Parenthesis followed by hash color', text: 'Renk (Navy) #001' },
  { desc: 'Semicolon followed by hash', text: 'İrsaliye kaydedildi; #104 nolu fiş kesildi' },
  { desc: 'Select box without attack', text: 'Formdaki select box seçeneğini işaretleyiniz' },
  { desc: 'SQL keyword union alone', text: 'Union kumaş üretimi' },
  { desc: 'SQL keyword from alone', text: 'From: Depo To: İhracat' },
  { desc: 'Turkish word veya alone', text: 'Nakit veya Çek' },
  { desc: 'Turkish word seçim alone', text: 'Ürün seçim ekranı' },
  { desc: 'Drop off alone', text: 'Drop off kargo teslimi' },
  { desc: 'Currency negative with dot and comma', text: '-$10.335,35 USD' },
  { desc: 'Currency euro with dot and comma', text: '€11.792,36 EUR' },
  { desc: 'Currency TL with symbol', text: '₺15.732,92 TL' },
  { desc: 'Textile slash and GSM', text: '30/2 Penye Süprem, 144 CM, 172 GSM' }
];

console.log('--- Probing Edge Cases ---');
edgeCases.forEach(ec => {
  const v = inspectPayload(ec.text);
  if (v) {
    console.log(`[BLOCKED] "${ec.desc}": ${v.ruleId} -> ${ec.text}`);
  } else {
    console.log(`[PASS] "${ec.desc}": ${ec.text}`);
  }
});
