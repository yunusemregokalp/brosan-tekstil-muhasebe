// Seed script for Brosan Tekstil ERP
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Brosan Tekstil ERP Veritabanı Tohumlama Başlatılıyor...');

  // 1. TEKDÜZEN HESAP PLANI (TDHP)
  const accountsData = [
    { code: '100.01', name: 'Merkez TL Kasası', type: 'ASSET', category: 'KASA', currency: 'TRY', balance: 145250.00 },
    { code: '100.02', name: 'Merkez USD Kasası', type: 'ASSET', category: 'KASA', currency: 'USD', balance: 28400.00 },
    { code: '100.03', name: 'Merkez EUR Kasası', type: 'ASSET', category: 'KASA', currency: 'EUR', balance: 19850.00 },
    { code: '102.01', name: 'Akbank Ticari Vadesiz TL', type: 'ASSET', category: 'BANKA', currency: 'TRY', balance: 685400.00 },
    { code: '102.02', name: 'Garanti BBVA İhracat USD', type: 'ASSET', category: 'BANKA', currency: 'USD', balance: 142000.00 },
    { code: '102.03', name: 'İş Bankası Şirket Hesabı', type: 'ASSET', category: 'BANKA', currency: 'TRY', balance: 312800.00 },
    { code: '101.01', name: 'Portföydeki Alınan Çekler', type: 'ASSET', category: 'KASA', currency: 'TRY', balance: 840000.00 },
    { code: '120.01', name: 'Alıcılar - Yurtiçi Müşteriler', type: 'ASSET', category: 'CARI', currency: 'TRY', balance: 1820450.00 },
    { code: '120.02', name: 'Alıcılar - Yurtdışı (İhracat)', type: 'ASSET', category: 'CARI', currency: 'EUR', balance: 95400.00 },
    { code: '191.01', name: 'İndirilecek KDV %10', type: 'ASSET', category: 'KDV', currency: 'TRY', balance: 64200.00 },
    { code: '191.02', name: 'İndirilecek KDV %20', type: 'ASSET', category: 'KDV', currency: 'TRY', balance: 189400.00 },
    { code: '320.01', name: 'Satıcılar - Kumaş & İplik Tedarikçileri', type: 'LIABILITY', category: 'CARI', currency: 'TRY', balance: 1420600.00 },
    { code: '320.02', name: 'Satıcılar - Boyahane & Fason Tedarikçileri', type: 'LIABILITY', category: 'CARI', currency: 'TRY', balance: 412500.00 },
    { code: '360.01', name: 'Ödenecek Gelir Vergisi (Stopaj)', type: 'LIABILITY', category: 'KDV', currency: 'TRY', balance: 48900.00 },
    { code: '361.01', name: 'Ödenecek SGK Primleri', type: 'LIABILITY', category: 'GIDER', currency: 'TRY', balance: 96400.00 },
    { code: '391.01', name: 'Hesaplanan KDV %10 (Tekstil)', type: 'LIABILITY', category: 'KDV', currency: 'TRY', balance: 184500.00 },
    { code: '391.02', name: 'Hesaplanan KDV %20 (Genel)', type: 'LIABILITY', category: 'KDV', currency: 'TRY', balance: 295000.00 },
    { code: '600.01', name: 'Yurtiçi Kumaş Satışları', type: 'REVENUE', category: 'SATIS', currency: 'TRY', balance: 4850000.00 },
    { code: '601.01', name: 'Yurtdışı Tekstil İhracatı', type: 'REVENUE', category: 'SATIS', currency: 'EUR', balance: 240000.00 },
    { code: '710.01', name: 'Direkt İlk Madde ve Malzeme (Ham Kumaş / İplik)', type: 'EXPENSE', category: 'GIDER', currency: 'TRY', balance: 2150000.00 },
    { code: '720.01', name: 'Direkt İşçilik Giderleri (Üretim Personeli)', type: 'EXPENSE', category: 'GIDER', currency: 'TRY', balance: 840000.00 },
    { code: '730.01', name: 'Genel Üretim Giderleri (Enerji, Boyahane Fason)', type: 'EXPENSE', category: 'GIDER', currency: 'TRY', balance: 460000.00 },
    { code: '770.01', name: 'Genel Yönetim Giderleri (Kira, Ofis, Muhasebe)', type: 'EXPENSE', category: 'GIDER', currency: 'TRY', balance: 285000.00 }
  ];

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc
    });
  }
  console.log(`✅ ${accountsData.length} Hesap Planı kartı işlendi.`);

  // 2. CARİ HESAPLAR (MÜŞTERİ & TEDARİKÇİ)
  const contactsData = [
    { code: 'CR-GB-0024', title: 'BEN ELLIS', type: 'CUSTOMER', taxOffice: 'UK HMRC', taxNumber: 'GB9283741', phone: '+44 161 832 1000', email: 'orders@benellis.co.uk', city: 'Manchester', country: 'Birleşik Krallık', balance: 547721.60 },
    { code: 'CR-IT-0015', title: 'MILANO TESSUTI SRL', type: 'CUSTOMER', taxOffice: 'Agenzia Entrate', taxNumber: 'IT04819028', phone: '+39 02 87654321', email: 'amministrazione@milanotessuti.it', city: 'Milano', country: 'İtalya', balance: 554289.60 },
    { code: 'CR-TR-0018', title: 'BİRLİK KUMAŞÇILIK SAN. TİC. LTD. ŞTİ.', type: 'SUPPLIER', taxOffice: 'Güneşli VD', taxNumber: '1780492811', phone: '+90 212 555 3344', email: 'muhasebe@birlikkumas.com', city: 'İstanbul', country: 'Türkiye', balance: -185000.00 },
    { code: 'CR-TR-0022', title: 'ÇETİN MENSUCAT BOYA VE APRE LTD.', type: 'SUPPLIER', taxOffice: 'İkitelli VD', taxNumber: '2450891234', phone: '+90 282 673 8899', email: 'fason@cetinboya.com', city: 'Tekirdağ', country: 'Türkiye', balance: -92400.00 },
    { code: 'M-101', title: 'ZARA SPAN GİYİM SAN. VE TİC. A.Ş.', type: 'CUSTOMER', taxOffice: 'Güneşli VD', taxNumber: '9980124510', phone: '+90 212 555 1020', email: 'finans@zaraspangiyim.com', city: 'İstanbul', balance: 485200.00 },
    { code: 'M-102', title: 'MANGO İSTANBUL TEKSTİL A.Ş.', type: 'CUSTOMER', taxOffice: 'Marmara VD', taxNumber: '8870192834', phone: '+90 212 444 8899', email: 'muhasebe@mangotekstil.com', city: 'İstanbul', balance: 340900.00 },
    { code: 'M-103', title: 'BERLIN FASHION TEXTILES GMBH', type: 'CUSTOMER', taxOffice: 'DE Foreign Tax', taxNumber: 'DE294819284', phone: '+49 30 9182736', email: 'orders@berlinfashion.de', city: 'Berlin', country: 'Almanya', balance: 95400.00 },
    { code: 'T-201', title: 'ÖZPAMUK İPLİK VE ELYAF SAN. TİC. LTD. ŞTİ.', type: 'SUPPLIER', taxOffice: 'Gaziantep VD', taxNumber: '4450192831', phone: '+90 342 321 4455', email: 'satis@ozpamuk.com.tr', city: 'Gaziantep', balance: -620000.00 },
    { code: 'T-202', title: 'AKDENİZ TEKSTİL BOYA VE APRE FABRİKASI A.Ş.', type: 'SUPPLIER', taxOffice: 'Çorlu VD', taxNumber: '5560918274', phone: '+90 282 654 1122', email: 'finans@akdenizboya.com', city: 'Tekirdağ', balance: -315400.00 },
    { code: 'T-203', title: 'TORUNLAR DOKUMA VE ÖRME SANAYİ LTD. ŞTİ.', type: 'SUPPLIER', taxOffice: 'Bursa Osmangazi VD', taxNumber: '7761928301', phone: '+90 224 211 9988', email: 'bilgi@torunlarorme.com', city: 'Bursa', balance: -485200.00 }
  ];

  for (const c of contactsData) {
    await prisma.contact.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
  }
  console.log(`✅ ${contactsData.length} Cari kartı işlendi.`);

  // 3. STOK VE GTİP KARTLARI
  const productsData = [
    { code: 'STK-KUM-01', name: '%100 Pamuk Süprem Kumaş 180gr (Optik Beyaz)', category: 'KUMAŞ', gtipCode: '5208.11.00.00.00', unit: 'KG', currentStock: 14250.50, minStock: 2000.0, unitCost: 185.00, salePrice: 245.00 },
    { code: 'STK-KUM-02', name: '2 İplik Şardonlu Sweat Kumaş 280gr (Melanj)', category: 'KUMAŞ', gtipCode: '6006.22.00.00.00', unit: 'KG', currentStock: 8900.00, minStock: 1500.0, unitCost: 220.00, salePrice: 295.00 },
    { code: 'STK-IPL-01', name: '30/1 Ne Penye Kompakt Pamuk İpliği', category: 'İPLİK', gtipCode: '5205.22.00.00.00', unit: 'KG', currentStock: 25400.00, minStock: 5000.0, unitCost: 140.00, salePrice: 175.00 },
    { code: 'STK-KUM-03', name: 'Likralı Süprem Kumaş (%95 Pamuk %5 Elasthan)', category: 'KUMAŞ', gtipCode: '6004.10.00.00.00', unit: 'MT', currentStock: 18600.00, minStock: 3000.0, unitCost: 110.00, salePrice: 155.00 }
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }
  console.log(`✅ ${productsData.length} Stok ve GTİP kartı işlendi.`);

  // 4. PERSONEL KARTLARI
  const employeesData = [
    { tcNo: '28491827364', fullName: 'Ahmet Yılmaz', department: 'Dokuma', position: 'Dokuma Şefi', startDate: new Date('2021-03-15'), grossSalary: 42000.00, netSalary: 31500.00, iban: 'TR330006200000000123456789' },
    { tcNo: '39482716450', fullName: 'Fatma Demir', department: 'Boyahane', position: 'Renk Laborantı', startDate: new Date('2022-06-01'), grossSalary: 38000.00, netSalary: 28900.00, iban: 'TR440006400000000987654321' },
    { tcNo: '18273940192', fullName: 'Mehmet Kaya', department: 'Muhasebe', position: 'Mali Müşavir / Genel Muhasebe', startDate: new Date('2020-01-10'), grossSalary: 55000.00, netSalary: 41250.00, iban: 'TR110001500000000554433221' }
  ];

  for (const e of employeesData) {
    await prisma.employee.upsert({
      where: { tcNo: e.tcNo },
      update: e,
      create: e
    });
  }
  console.log(`✅ ${employeesData.length} Personel kartı işlendi.`);

  console.log('🎉 Brosan Tekstil ERP Veritabanı Başarıyla Tohumlandı!');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
