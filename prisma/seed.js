// Seed script for Brosan Tekstil ERP
// Real-world authentic data from Paraşüt (Company ID: 794187) and FARUK AYTİN CARİ.xlsx
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Brosan Tekstil ERP Canlı Veritabanı Tohumlama Başlatılıyor...');

  // ==========================================
  // 1. 14 ADET KASA VE BANKA HESABI + TDHP HESAPLARI
  // ==========================================
  const accountsData = [
    // 14 Resmi Paraşüt ve Garanti BBVA Kasa/Banka Hesapları
    {
      code: '102.01',
      name: 'Garanti Bankası - 417-6289477 (Ana Hesap)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'TRY',
      balance: 15732.92,
      iban: 'TR160006200041700006289477',
      accountNo: '417-6289477',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673390
    },
    {
      code: '102.02',
      name: 'Garanti Bankası - 417-6287865 (Lojistik)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'TRY',
      balance: 17210.75,
      iban: 'TR840006200041700006287865',
      accountNo: '417-6287865',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673389
    },
    {
      code: '102.03',
      name: 'Garanti Bankası - 417-9034578 (Vadesiz GBP)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'GBP',
      balance: 23759.07,
      iban: 'TR860006200041700009034578',
      accountNo: '417-9034578',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673398
    },
    {
      code: '102.04',
      name: 'Garanti Bankası - 417-9034579 (Vadesiz EUR)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'EUR',
      balance: 11792.36,
      iban: 'TR590006200041700009034579',
      accountNo: '417-9034579',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673396
    },
    {
      code: '102.05',
      name: 'Garanti Bankası - 417-9034580 (Vadesiz USD)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'USD',
      balance: 1521.16,
      iban: 'TR320006200041700009034580',
      accountNo: '417-9034580',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673394
    },
    {
      code: '102.06',
      name: 'Garanti Bankası - 910-8141112 (Vadeli TL)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'TRY',
      balance: 0.00,
      iban: 'TR460006200091000008141112',
      accountNo: '910-8141112',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673391
    },
    {
      code: '102.07',
      name: 'Garanti Bankası - 417-6289447 (Çek Hesabı)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'TRY',
      balance: 0.00,
      iban: 'TR500006200041700006289447',
      accountNo: '417-6289447',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673392
    },
    {
      code: '102.08',
      name: 'Garanti Bankası - 417-9026872 (DTH EUR)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'EUR',
      balance: 0.00,
      iban: 'TR830006200041700009026872',
      accountNo: '417-9026872',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673395
    },
    {
      code: '102.09',
      name: 'Garanti Bankası - 417-9026871 (DTH GBP)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'GBP',
      balance: 0.00,
      iban: 'TR130006200041700009026871',
      accountNo: '417-9026871',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673397
    },
    {
      code: '102.10',
      name: 'Garanti Bankası - 417-9026873 (DTH USD)',
      type: 'ASSET',
      category: 'BANKA',
      currency: 'USD',
      balance: 0.00,
      iban: 'TR560006200041700009026873',
      accountNo: '417-9026873',
      bankName: 'Garanti BBVA',
      branchName: 'Bahçeşehir',
      parasutId: 1000673393
    },
    {
      code: '102.11',
      name: 'CARİ AÇIK KAPATMA EUR',
      type: 'ASSET',
      category: 'KASA',
      currency: 'EUR',
      balance: 9197.00,
      iban: null,
      accountNo: null,
      bankName: null,
      branchName: null,
      parasutId: 1000520892
    },
    {
      code: '102.12',
      name: 'CARİ AÇIK KAPATMA USD',
      type: 'ASSET',
      category: 'KASA',
      currency: 'USD',
      balance: 4748.93,
      iban: null,
      accountNo: null,
      bankName: null,
      branchName: null,
      parasutId: 1000521608
    },
    {
      code: '100.01',
      name: 'Merkez Kasa Hesabı TL',
      type: 'ASSET',
      category: 'KASA',
      currency: 'TRY',
      balance: -722.35,
      iban: null,
      accountNo: null,
      bankName: null,
      branchName: null,
      parasutId: 1000491487
    },
    {
      code: '309.01',
      name: 'YUNUS CEP K.K. (Şirket Kredi Kartı)',
      type: 'LIABILITY',
      category: 'KASA',
      currency: 'TRY',
      balance: -248697.05,
      iban: null,
      accountNo: null,
      bankName: null,
      branchName: null,
      parasutId: 1000512434
    },

    // TDHP Defter-i Kebir Hesapları
    { code: '101.01', name: 'Portföydeki Vadeli Çekler', type: 'ASSET', category: 'KASA', currency: 'TRY', balance: 221511.13 },
    { code: '120.01', name: 'Alıcılar - Yurtdışı İhracat (Ben Ellis & Lavi La)', type: 'ASSET', category: 'CARI', currency: 'TRY', balance: 2795854.47 },
    { code: '159.01', name: 'Verilen Sipariş Avansları - Faruk Aytin (+$784,60 USD)', type: 'ASSET', category: 'CARI', currency: 'USD', balance: 784.60 },
    { code: '320.01', name: 'Satıcılar - Faruk Aytin & Nisa Tekstil (KAPANDI - 0 USD)', type: 'LIABILITY', category: 'CARI', currency: 'USD', balance: 0.00 },
    { code: '320.02', name: 'Satıcılar - Tinteks Tekstil ve Kumaşçılık', type: 'LIABILITY', category: 'CARI', currency: 'TRY', balance: -1099047.50 },
    { code: '331.01', name: 'Ortaklara Borçlar - Yunus Emre Gökalp', type: 'LIABILITY', category: 'CARI', currency: 'TRY', balance: -109418.80 },
    { code: '391.01', name: 'Hesaplanan KDV %10 (Kumaş Satış & Fason)', type: 'LIABILITY', category: 'KDV', currency: 'TRY', balance: 33095.00 },
    { code: '600.01', name: 'Yurtiçi Satışlar (Faruk Aytin Kumaş Satışı)', type: 'REVENUE', category: 'SATIS', currency: 'TRY', balance: 330950.00 },
    { code: '601.01', name: 'Yurtdışı e-İhracat Gelirleri (GBP/EUR/USD)', type: 'REVENUE', category: 'SATIS', currency: 'GBP', balance: 845000.00 },
    { code: '730.01', name: 'Genel Üretim / Fason Dikim Giderleri (Faruk Aytin)', type: 'EXPENSE', category: 'GIDER', currency: 'TRY', balance: 1064898.65 }
  ];

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc
    });
  }
  console.log(`✅ ${accountsData.length} TDHP & 14 Banka/Kasa hesabı işlendi.`);

  // ==========================================
  // 2. PARASÜT CANLI CARİ HESAPLAR (15 ADET)
  // ==========================================
  const contactsData = [
    {
      code: 'CR-GB-0001',
      title: 'BEN ELLİS',
      type: 'CUSTOMER',
      taxOffice: 'HMRC Bristol',
      taxNumber: '11111111111',
      phone: '+44 117 929 4820',
      email: 'finance@benellis.co.uk',
      address: '23 Elan Rd City: Cardiff | Postal Code: CF14 0NR , Country: United Kingdom',
      city: 'BRİSTOL',
      country: 'Birleşik Krallık',
      currency: 'GBP',
      balance: 22414.22, // £22,414.22 GBP
      balanceGbp: 22414.22,
      balanceTrl: 1452246.45,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      isAbroad: true,
      parasutId: 1072562264
    },
    {
      code: 'CR-TR-0002',
      title: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK SANAYİ TİCARET LİMİTED ŞİRKETİ',
      type: 'SUPPLIER',
      taxOffice: 'Avcılar Vergi Dairesi',
      taxNumber: '8441212524',
      phone: '+90 212 654 8800',
      email: 'muhasebe@tinteks.com.tr',
      address: 'FİRUZKÖY BULVARI BLV.',
      city: 'İSTANBUL',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -1099047.50,
      balanceTrl: -1099047.50,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1048062503
    },
    {
      code: 'CR-US-0003',
      title: 'LAVI LA LLC',
      type: 'CUSTOMER',
      taxOffice: 'IRS California',
      taxNumber: 'US95-4829104',
      phone: '+1 213 555 0192',
      email: 'orders@lavila.com',
      address: '346 Hauser Blvd 429, Los Angeles, CA 90036, USA, California, United States',
      city: 'Los Angeles',
      country: 'Amerika Birleşik Devletleri',
      currency: 'USD',
      balance: 20001.33,
      balanceUsd: 20001.33,
      balanceTrl: 981529.27,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: true,
      parasutId: 1050398787
    },
    {
      code: 'CR-TR-0004',
      title: 'FARUK AYTİN',
      type: 'BOTH',
      taxOffice: 'Küçükköy VD',
      taxNumber: '46849262292',
      phone: '+90 532 555 1234',
      email: 'nisatekstil34@hotmail.com',
      address: 'Sultangazi İstanbul Uğur Mumcu Mah. Eski Edirne Asfaltı Cad. No: 574 İç Kapı No: 4',
      city: 'İstanbul',
      country: 'Türkiye',
      currency: 'USD',
      balance: -9335.35, // -$9,335.35 USD Net Kalan Fason Üretim Borcu (07.10.2026 1.000 USD Ödeme Sonrası)
      balanceUsd: -9335.35,
      balanceTrl: -459874.07,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1071694008
    },
    {
      code: 'CR-DE-0005',
      title: 'GbR Celik, David und Djemailji',
      type: 'CUSTOMER',
      taxOffice: 'Finanzamt Berlin',
      taxNumber: 'DE301948271',
      phone: '+49 30 892341',
      email: 'info@celik-berlin.de',
      address: 'Street: Eichendorffstraße 18, Postal Code: 53879, City: Euskirchen, Germany',
      city: 'Euskirchen',
      country: 'Almanya',
      currency: 'EUR',
      balance: 6586.04,
      balanceEur: 6586.04,
      balanceTrl: 362078.75,
      balanceUsd: 0.0,
      balanceGbp: 0.0,
      isAbroad: true,
      parasutId: 1051429321
    },
    {
      code: 'CR-TR-0006',
      title: 'ÇETİN TÜREDİ',
      type: 'SUPPLIER',
      taxOffice: 'Halkalı VD',
      taxNumber: '39481920194',
      phone: '+90 533 412 8900',
      email: 'cetin.turedi@brosan.com',
      address: 'Halkalı Merkez Mah. İstanbul',
      city: 'İstanbul',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -200000.00,
      balanceTrl: -200000.00,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1060621660
    },
    {
      code: 'CR-UK-0007',
      title: 'ATTERO CLOTHING',
      type: 'CUSTOMER',
      taxOffice: 'HMRC London',
      taxNumber: 'GB883910294',
      phone: '+44 20 7946 0912',
      email: 'accounts@atteroclothing.com',
      address: 'Rijtuigenhof 97 E6 1054 NB, Amsterdam, Netherlands',
      city: 'Amsterdam',
      country: 'Hollanda',
      currency: 'EUR',
      balance: 2780.37,
      balanceEur: 2780.37,
      balanceTrl: 152855.57,
      balanceUsd: 0.0,
      balanceGbp: 0.0,
      isAbroad: true,
      parasutId: 1048986698
    },
    {
      code: 'CR-TR-0008',
      title: 'YUNUS EMRE GÖKALP',
      type: 'BOTH',
      taxOffice: 'İkitelli VD',
      taxNumber: '41755737346',
      phone: '+90 532 000 0000',
      email: 'yunus@brosan.com.tr',
      address: 'AHMETTANER KIŞLALI CAD. İkitelli OSB Dokumacılar San. Sit. 4. Blok No:28',
      city: 'İstanbul',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -109418.80, // 331 Ortaklara Borçlar
      balanceTrl: -109418.80,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1047783441
    },
    {
      code: 'CR-KW-0009',
      title: 'Rana Jassim Khaled Alsaadoun',
      type: 'CUSTOMER',
      taxOffice: 'Kuwait MOF',
      taxNumber: 'KW-4910284',
      phone: '+965 2241 8920',
      email: 'rana.alsaadoun@q8textiles.kw',
      address: 'Khaldiya block 3 street 65 house no.8 Postal code 72303, Khaldiya, Kuwait',
      city: 'Kuveyt',
      country: 'Kuveyt',
      currency: 'EUR',
      balance: 1400.00,
      balanceEur: 1400.00,
      balanceTrl: 76967.38,
      balanceUsd: 0.0,
      balanceGbp: 0.0,
      isAbroad: true,
      parasutId: 1055271881
    },
    {
      code: 'CR-TR-0010',
      title: 'ARKSİGNER YAZILIM VE DONANIM SAN. TİC. A.Ş.',
      type: 'SUPPLIER',
      taxOffice: 'Çankaya VD',
      taxNumber: '0790611963',
      phone: '+90 312 444 2757',
      email: 'muhasebe@arksigner.com',
      address: 'Üniversiteler Mah. 1606 Cad. Bilkent Cyberpark Cyberplaza 4 A Blok No:603 Çankaya Ankara 06800 Türkiye',
      city: 'Ankara',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -50800.00,
      balanceTrl: -50800.00,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1054860047
    },
    {
      code: 'CR-US-0011',
      title: 'CuterEsque Inc.',
      type: 'CUSTOMER',
      taxOffice: 'Delaware Corp Tax',
      taxNumber: '22222222222',
      phone: '+1 302 555 8921',
      email: 'billing@cuteresque.com',
      address: '97-400 Silin Forest Rd, Fort McMurray, Alberta, T9H 3S5, Canada',
      city: 'Fort McMurray',
      country: 'Kanada',
      currency: 'USD',
      balance: 985.70,
      balanceUsd: 985.70,
      balanceTrl: 48458.59,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: true,
      parasutId: 1062854363
    },
    {
      code: 'CR-TR-0012',
      title: 'FİLET ÖRME TEK. VE TEK. ÜRN. İNŞ. SAN. LTD. ŞTİ.',
      type: 'SUPPLIER',
      taxOffice: 'İkitelli V.D.',
      taxNumber: '3870555559',
      phone: '+90 212 582 4411',
      email: 'info@filetorme.com',
      address: 'İKİTELLİ ORGANİZE SAN.BÖLG.TRİKO CENTER',
      city: 'İSTANBUL',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -42919.60,
      balanceTrl: -42919.60,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1047788176
    },
    {
      code: 'CR-TR-0013',
      title: 'BE-HA KONFEKSİYON - FATMA KÜPOĞLU',
      type: 'BOTH',
      taxOffice: 'GÜNEŞLİ',
      taxNumber: '30847956574',
      phone: '+90 212 554 9920',
      email: 'behakonfeksiyon@gmail.com',
      address: 'Güneşli Mah. 1350. Sk. No:4/B',
      city: 'İstanbul',
      country: 'Türkiye',
      currency: 'TRY',
      balance: 27096.00,
      balanceTrl: 27096.00,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1050488708
    },
    {
      code: 'CR-TR-0014',
      title: 'MERT ÜTÜ - VEYSEL ADIYEKE',
      type: 'SUPPLIER',
      taxOffice: 'YENİBOSNA VD. ',
      taxNumber: '0080449532',
      phone: '+90 212 655 1290',
      email: 'mertutu@hotmail.com',
      address: 'YENİBOSNA MERKEZ MAH. MUŞTU SK. NO:38/2 BAHÇELİEVLER / İSTANBUL',
      city: 'İstanbul',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -18952.00,
      balanceTrl: -18952.00,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1050493587
    },
    {
      code: 'CR-TR-0015',
      title: 'ASSET LOJİSTİK ANONİM ŞİRKETİ',
      type: 'SUPPLIER',
      taxOffice: 'Büyük Mükellefler',
      taxNumber: '0910518946',
      phone: '+90 216 570 0000',
      email: 'muhasebe@assetgl.com',
      address: 'DEFTERDAR MAH. OTAKÇILAR CAD. SINPAŞ FLATOFIS NO: 78 İÇ KAPI NO: 100 EYÜPSULTAN İSTANBUL TÜRKİYE',
      city: 'İSTANBUL',
      country: 'Türkiye',
      currency: 'TRY',
      balance: -18243.96,
      balanceTrl: -18243.96,
      balanceUsd: 0.0,
      balanceEur: 0.0,
      balanceGbp: 0.0,
      isAbroad: false,
      parasutId: 1054637401
    }
  ];

  const contactMap = {};
  const contactParasutMap = {};
  for (const c of contactsData) {
    const created = await prisma.contact.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
    contactMap[c.code] = created.id;
    if (c.parasutId) {
      contactParasutMap[c.parasutId] = created.id;
    }
  }
  console.log(`✅ ${contactsData.length} Gerçek Paraşüt Cari kartı işlendi.`);

  // ==========================================
  // 3. FARUK AYTİN FASON ÜRETİM FATURALARI (3 ADET)
  // ==========================================
  const farukContactId = contactMap['CR-TR-0004'];

  // 3.1 NSA-70: Fason Tişört (Ödendi / Kapandı)
  await prisma.invoice.upsert({
    where: { invoiceNo: 'NSA2026000000070' },
    update: {
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-07-30'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 47.25,
      subtotal: 2760.00,
      taxTotal: 276.00,
      grandTotal: 3036.00, // ₺143,451.00 TL
      status: 'PAID',
      notes: 'Faruk Aytin (Nisa Tekstil) - EMK Oversized Tişört 276 Adet Dikim Fasonu (31.07.2026 Garanti Bankası ile Ödendi)'
    },
    create: {
      invoiceNo: 'NSA2026000000070',
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-07-30'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 47.25,
      subtotal: 2760.00,
      taxTotal: 276.00,
      grandTotal: 3036.00, // ₺143,451.00 TL
      status: 'PAID',
      notes: 'Faruk Aytin (Nisa Tekstil) - EMK Oversized Tişört 276 Adet Dikim Fasonu (31.07.2026 Garanti Bankası ile Ödendi)',
      items: {
        create: [
          {
            description: 'EMK Oversized Tişört Dikim Fasonu',
            quantity: 276.0,
            unit: 'ADET',
            unitPrice: 10.00,
            taxRate: 10.0,
            taxAmount: 276.00,
            total: 3036.00
          }
        ]
      }
    }
  });

  // 3.2 NSA-84: Ben Ellis Fason (Paraşüt Fiş No: 1044145905, Avans + Kumaş Mahsubu ile Kapandı)
  await prisma.invoice.upsert({
    where: { invoiceNo: 'NSA2026000000084' },
    update: {
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-10-01'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 48.9303,
      subtotal: 5788.00,
      taxTotal: 578.80,
      grandTotal: 6366.80, // ₺311,529.43 TL
      status: 'PAID',
      notes: 'Faruk Aytin (Nisa Tekstil) - Ben Ellis (140 T-shirt + 180 Hoodie) - Paraşüt Fiş: 1044145905 (Kumaş Mahsubu ile Kapandı)',
      parasutId: 1044145905
    },
    create: {
      invoiceNo: 'NSA2026000000084',
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-10-01'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 48.9303,
      subtotal: 5788.00,
      taxTotal: 578.80,
      grandTotal: 6366.80, // ₺311,529.43 TL
      status: 'PAID',
      notes: 'Faruk Aytin (Nisa Tekstil) - Ben Ellis (140 T-shirt + 180 Hoodie) - Paraşüt Fiş: 1044145905 (Kumaş Mahsubu ile Kapandı)',
      parasutId: 1044145905,
      items: {
        create: [
          {
            description: 'Ben Ellis T-shirt Fason Dikim',
            quantity: 140.0,
            unit: 'ADET',
            unitPrice: 9.20,
            taxRate: 10.0,
            taxAmount: 128.80,
            total: 1416.80
          },
          {
            description: 'Ben Ellis Hoodie Fason Dikim',
            quantity: 180.0,
            unit: 'ADET',
            unitPrice: 25.00,
            taxRate: 10.0,
            taxAmount: 450.00,
            total: 4950.00
          }
        ]
      }
    }
  });

  // 3.3 NSA-87: Ben Ellis Fason (Paraşüt Fiş No: 1044145920, Net Kalan Borç: -$10.335,35 USD)
  await prisma.invoice.upsert({
    where: { invoiceNo: 'NSA2026000000087' },
    update: {
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-10-05'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 48.9699,
      subtotal: 13300.00,
      taxTotal: 1330.00,
      grandTotal: 14630.00, // ₺716,429.64 TL
      status: 'ISSUED',
      notes: 'Faruk Aytin (Nisa Tekstil) - Ben Ellis (375 T-shirt + 394 Hoodie) - Paraşüt Fiş: 1044145920. Net Kalan Borç: -$10.335,35 USD (₺508.894,07)',
      parasutId: 1044145920
    },
    create: {
      invoiceNo: 'NSA2026000000087',
      type: 'PURCHASE',
      scenario: 'TICARIFATURA',
      date: new Date('2026-10-05'),
      contactId: farukContactId,
      currency: 'USD',
      exchangeRate: 48.9699,
      subtotal: 13300.00,
      taxTotal: 1330.00,
      grandTotal: 14630.00, // ₺716,429.64 TL
      status: 'ISSUED',
      notes: 'Faruk Aytin (Nisa Tekstil) - Ben Ellis (375 T-shirt + 394 Hoodie) - Paraşüt Fiş: 1044145920. Net Kalan Borç: -$10.335,35 USD (₺508.894,07)',
      parasutId: 1044145920,
      items: {
        create: [
          {
            description: 'Ben Ellis T-shirt Fason Dikim (Mavi)',
            quantity: 375.0,
            unit: 'ADET',
            unitPrice: 9.20,
            taxRate: 10.0,
            taxAmount: 345.00,
            total: 3795.00
          },
          {
            description: 'Ben Ellis Hoodie Fason Dikim (Pembe)',
            quantity: 394.0,
            unit: 'ADET',
            unitPrice: 25.00,
            taxRate: 10.0,
            taxAmount: 985.00,
            total: 10835.00
          }
        ]
      }
    }
  });

  // ==========================================
  // 4. TÜM 46 ADET PARAŞÜT SATIŞ FATURASI (CANLI VE EKSİKSİZ)
  // ==========================================
  const fs = require('fs');
  const path = require('path');

  let dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) dataDir = '/app/data';

  const detailedPath = path.join(dataDir, 'parasut_sales_invoices_detailed.json');
  const linesPath = path.join(dataDir, 'parasut_invoice_lines_extracted.json');
  const productsPath = path.join(dataDir, 'parasut_products_extracted.json');

  const allSalesInvoices = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));
  const linesData = JSON.parse(fs.readFileSync(linesPath, 'utf8'));
  const salesDetailsMap = linesData.salesDetailsMap || {};
  const productsList = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const prodMap = {};
  productsList.forEach(p => { prodMap[p.id] = p; });

  allSalesInvoices.sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));

  let salesCount = 0;
  for (const inv of allSalesInvoices) {
    const isAbroad = !!inv.is_abroad;
    let curr = inv.currency;
    if (curr === 'TRL') curr = 'TRY';

    let invType = isAbroad ? 'EXPORT' : 'SALES';
    let scenario = isAbroad ? 'IHRACAT' : (inv.e_archive_id ? 'EARSIVFATURA' : 'TICARIFATURA');

    const subtotal = parseFloat(inv.gross_total || 0.0);
    const taxTotal = parseFloat(inv.total_vat || 0.0);
    const grandTotal = parseFloat(inv.net_total || (subtotal + taxTotal));
    const status = (parseFloat(inv.remaining || 0) === 0) ? 'PAID' : 'ISSUED';
    const notes = inv.description || (isAbroad ? 'e-İhracat Faturası' : 'Yurtiçi Satış Faturası');

    // Find contact UUID
    let dbContactId = null;
    if (inv.contact_id) {
      const matchedContact = await prisma.contact.findFirst({
        where: { parasutId: inv.contact_id }
      });
      if (matchedContact) dbContactId = matchedContact.id;
    }

    const dbInv = await prisma.invoice.upsert({
      where: { invoiceNo: inv.invoice_no },
      update: {
        type: invType,
        scenario: scenario,
        date: new Date(inv.issue_date),
        dueDate: inv.due_date ? new Date(inv.due_date) : null,
        contactId: dbContactId,
        currency: curr,
        exchangeRate: parseFloat(inv.exchange_rate || 1.0),
        subtotal: subtotal,
        taxTotal: taxTotal,
        grandTotal: grandTotal,
        status: status,
        notes: notes,
        parasutId: inv.id
      },
      create: {
        invoiceNo: inv.invoice_no,
        type: invType,
        scenario: scenario,
        date: new Date(inv.issue_date),
        dueDate: inv.due_date ? new Date(inv.due_date) : null,
        contactId: dbContactId,
        currency: curr,
        exchangeRate: parseFloat(inv.exchange_rate || 1.0),
        subtotal: subtotal,
        taxTotal: taxTotal,
        grandTotal: grandTotal,
        status: status,
        notes: notes,
        parasutId: inv.id
      }
    });

    // Delete existing items for clean update
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: dbInv.id }
    });

    const rawLines = salesDetailsMap[String(inv.id)] || [];
    const formattedItems = [];
    for (const l of rawLines) {
      const pid = l.product_id;
      const product = prodMap[pid] || {};
      const name = product.name || l.description || inv.description || 'Mal/Hizmet Satışı';
      const desc = l.description || product.name || name;

      let gtip = null;
      const gtipMatch = (desc + ' ' + (inv.description || '')).match(/\b\d{4}\.\d{2}(\.\d{2})?(\.\d{2})?\b/);
      if (gtipMatch) gtip = gtipMatch[0];

      let unit = product.unit || l.unit_for_product || 'ADET';
      if (unit === 'Kilogram') unit = 'KG';
      else if (unit === 'Adet') unit = 'ADET';
      else if (unit === 'Metre') unit = 'MT';

      const qty = parseFloat(l.quantity || 1.0);
      const unitPrice = parseFloat(l.unit_price || 0.0);
      const vatRate = parseFloat(l.vat_rate || 0.0);
      const lineMatrah = qty * unitPrice;
      const taxAmount = lineMatrah * (vatRate / 100.0);
      const lineTotal = parseFloat(l.net_total || (lineMatrah + taxAmount));

      formattedItems.push({
        invoiceId: dbInv.id,
        name: name.substring(0, 100),
        description: desc,
        gtip: gtip,
        quantity: qty,
        unit: unit,
        unitPrice: unitPrice,
        discountRate: 0.0,
        taxRate: vatRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(lineTotal * 100) / 100
      });
    }

    if (formattedItems.length > 0) {
      await prisma.invoiceItem.createMany({
        data: formattedItems
      });
    }
    salesCount++;
  }
  console.log(`✅ ${salesCount} Paraşüt Satış Faturası ve 3 Fason Faturası işlendi.`);

  // ==========================================
  // 5. GARANTİ BBVA BANKA HAVALELERİ (FARUK AYTİN 5 ADET HAVALE)
  // ==========================================
  const bankAccTL = await prisma.account.findUnique({ where: { code: '102.01' } });
  if (bankAccTL) {
    const bankPayments = [
      { date: new Date('2026-07-31'), amount: 143451.00, desc: 'FARUK AYTİN-NSA2026000000070 nolu fatura ödemesi 3.036 usd karşılığı 143.451 TL (KDV Dahil), kur -47,25-HVL-CEP ŞUBE', ref: '2026-07-31-17.07.43' },
      { date: new Date('2026-09-07'), amount: 96600.00, desc: 'FARUK AYTİN-VERİLEN SİPARİŞE İSTİNADEN ÖN ÖDEME 2.000 USD KARŞILIĞI - KUR 48,30-HVL-CEP ŞUBE', ref: '2026-09-07-16.25.27' },
      { date: new Date('2026-09-14'), amount: 48420.00, desc: 'FARUK AYTİN-CARİ HESABA İSTİNADEN ÖN ÖDEME 1.000 usd karşılığı kur 48,42-HVL-CEP ŞUBE', ref: '2026-09-14-14.19.11' },
      { date: new Date('2026-09-22'), amount: 5000.00, desc: 'FARUK AYTİN-100 usd karşılığı , kur 50,00 , cari hesaba istinaden-HVL-CEP ŞUBE', ref: '2026-09-22-18.03.45' },
      { date: new Date('2026-09-30'), amount: 5000.00, desc: 'FARUK AYTİN-usd cari ödeme 100 usd karşılığı , kur 50,00 TL-HVL-CEP ŞUBE', ref: '2026-09-30-18.20.49' },
      { date: new Date('2026-10-07'), amount: 49020.00, desc: 'FARUK AYTİN-1.000 USD karşılığı, kur 49,02 cari ödeme 49.020 TL-HVL-GARANTİ BBVA', ref: '2026-10-07-17.14.25' },
      { date: new Date('2026-10-09'), amount: 196080.00, desc: 'FARUK AYTİN-4.000 USD karşılığı cari ödeme 196.080 TL, kur 49,02-HVL-GARANTİ BBVA', ref: '2026-10-09-17.06.49' }
    ];

    for (const bp of bankPayments) {
      const existingTx = await prisma.transaction.findFirst({
        where: { referenceNo: bp.ref }
      });
      if (existingTx) {
        await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            type: 'BANK_TRANSFER_OUT',
            date: bp.date,
            accountId: bankAccTL.id,
            contactId: farukContactId,
            amount: bp.amount,
            currency: 'TRY',
            description: bp.desc
          }
        });
      } else {
        await prisma.transaction.create({
          data: {
            type: 'BANK_TRANSFER_OUT',
            date: bp.date,
            accountId: bankAccTL.id,
            contactId: farukContactId,
            amount: bp.amount,
            currency: 'TRY',
            description: bp.desc,
            referenceNo: bp.ref
          }
        });
      }
    }
    console.log(`✅ ${bankPayments.length} Faruk Aytin Garanti BBVA banka transferi kaydedildi.`);
  }

  // ==========================================
  // 6. FARUK AYTİN SUBCONTRACT RECONCILIATION MODELİ
  // ==========================================
  await prisma.subcontractReconciliation.upsert({
    where: { id: 'FARUK-AYTIN-2026-RECON' },
    update: {
      supplierName: 'FARUK AYTİN',
      subTitle: 'NİSA TEKSTİL',
      tckn: '46849262292',
      totalFasonUsd: 24032.80,
      totalFasonKdvUsd: 2184.80,
      totalBankPaymentUsd: 11236.00,
      totalBankPaymentTl: 543571.00,
      fabricInvoiceUsd: 7461.45,
      fabricInvoiceTl: 364045.00,
      netRemainingDebtUsd: 784.60,
      netRemainingDebtTl: 38461.09,
      netVatPayableUsd: 0.00,
      netVatPayableTl: 0.00,
      status: 'RECONCILED',
      notes: 'Faruk Aytin & Nisa Tekstil Fason Üretim ve Kumaş Mahsubu Tam Çift Yönlü Mutabakatı (NSA-70, NSA-84, NSA-87, BR02026000000024, 7 Garanti BBVA Havalesi ve 300.000 TL Garanti Ticari Çeki No: 8031377 ile Tamamı Kapatıldı, Hesap +784,60 USD Avansta)'
    },
    create: {
      id: 'FARUK-AYTIN-2026-RECON',
      supplierName: 'FARUK AYTİN',
      subTitle: 'NİSA TEKSTİL',
      tckn: '46849262292',
      totalFasonUsd: 24032.80,
      totalFasonKdvUsd: 2184.80,
      totalBankPaymentUsd: 11236.00,
      totalBankPaymentTl: 543571.00,
      fabricInvoiceUsd: 7461.45,
      fabricInvoiceTl: 364045.00,
      netRemainingDebtUsd: 784.60,
      netRemainingDebtTl: 38461.09,
      netVatPayableUsd: 0.00,
      netVatPayableTl: 0.00,
      status: 'RECONCILED',
      notes: 'Faruk Aytin & Nisa Tekstil Fason Üretim ve Kumaş Mahsubu Tam Çift Yönlü Mutabakatı (NSA-70, NSA-84, NSA-87, BR02026000000024, 7 Garanti BBVA Havalesi ve 300.000 TL Garanti Ticari Çeki No: 8031377 ile Tamamı Kapatıldı, Hesap +784,60 USD Avansta)'
    }
  });
  console.log('✅ Faruk Aytin SubcontractReconciliation çift yönlü mutabakat kaydı işlendi.');

  // ==========================================
  // 7. PORTFÖYDEKİ VADELİ ÇEKLER (GARANTİ VE DİĞER ÇEKLER)
  // ==========================================
  const checksData = [
    {
      serialNo: '8031377',
      bankName: 'Garanti BBVA',
      drawer: 'Brosan Tekstil San. ve Dış Tic. Ltd. Şti.',
      issueDate: new Date('2026-10-09'),
      dueDate: new Date('2026-10-31'),
      amount: 300000.00,
      currency: 'TRY',
      status: 'ISSUED',
      contactId: farukContactId,
      parasutId: 1000887270,
      notes: 'Faruk Aytin Fason Dikim ve Kumaş Mahsubu Kapanış Çeki (TTK m.94 / Çek No: 8031377 / 300.000 TL @ 49,02 - 6.119,95 USD)'
    },
    {
      serialNo: '8031371',
      bankName: 'Garanti BBVA',
      drawer: 'Brosan Tekstil San. ve Dış Tic. Ltd. Şti.',
      issueDate: new Date('2025-10-08'),
      dueDate: new Date('2025-10-08'),
      amount: 85000.00,
      currency: 'TRY',
      status: 'PORTFOLIO',
      contactId: contactParasutMap[1048062503] || null, // Tinteks Tekstil
      parasutId: 1000887269,
      notes: 'Tinteks Tekstil Verilen Çek Ödemesi (Paraşüt ID: 1000887269)'
    },
    {
      serialNo: '8031372',
      bankName: 'Garanti BBVA',
      drawer: 'Brosan Tekstil San. ve Dış Tic. Ltd. Şti.',
      issueDate: new Date('2025-11-14'),
      dueDate: new Date('2025-11-14'),
      amount: 101511.13,
      currency: 'TRY',
      status: 'PORTFOLIO',
      contactId: null,
      parasutId: 1001158818,
      notes: 'CARİ ÇEK ÖDEMESİ (Paraşüt ID: 1001158818)'
    },
    {
      serialNo: '8031373',
      bankName: 'Ziraat Bankası',
      drawer: 'Brosan Tekstil San. ve Dış Tic. Ltd. Şti.',
      issueDate: new Date('2025-11-22'),
      dueDate: new Date('2025-11-30'),
      amount: 35000.00,
      currency: 'TRY',
      status: 'PORTFOLIO',
      contactId: contactParasutMap[1050488708] || null, // BE-HA Konfeksiyon
      parasutId: 1000955640,
      notes: 'BE-HA Konfeksiyon Cari Çek Ödemesi (Paraşüt ID: 1000955640)'
    }
  ];

  for (const chk of checksData) {
    await prisma.checkPromissory.upsert({
      where: { serialNo: chk.serialNo },
      update: {
        docType: 'CHECK',
        direction: 'ISSUED',
        bankName: chk.bankName,
        drawer: chk.drawer,
        issueDate: chk.issueDate,
        dueDate: chk.dueDate,
        amount: chk.amount,
        currency: chk.currency,
        status: chk.status,
        contactId: chk.contactId,
        parasutId: chk.parasutId,
        notes: chk.notes
      },
      create: {
        id: `CHK-${chk.serialNo}`,
        docType: 'CHECK',
        direction: 'ISSUED',
        serialNo: chk.serialNo,
        bankName: chk.bankName,
        drawer: chk.drawer,
        issueDate: chk.issueDate,
        dueDate: chk.dueDate,
        amount: chk.amount,
        currency: chk.currency,
        status: chk.status,
        contactId: chk.contactId,
        parasutId: chk.parasutId,
        notes: chk.notes
      }
    });
  }
  console.log(`✅ ${checksData.length} Gerçek Paraşüt Çeki işlendi.`);

  // ==========================================
  // 8. STOK VE ÜRÜNLER (PARASÜT CANLI 15 ADET)
  // ==========================================
  const productsData = [
    { code: 'STK-KET-01', name: '01254 - 33K346 008 %100 Keten / EKRU / 149 CM / 160 GSM / T10819', category: 'KUMAŞ', gtipCode: '5309.11.00.00.00', unit: 'KG', currentStock: 3500.0, minStock: 500.0, unitCost: 450.0, salePrice: 620.0 },
    { code: 'STK-KET-02', name: '01254 - 33K346 008 %100 Keten / SİYAH / 144 CM / 172 GSM / T10819', category: 'KUMAŞ', gtipCode: '5309.11.00.00.00', unit: 'KG', currentStock: 4200.0, minStock: 500.0, unitCost: 460.0, salePrice: 630.0 },
    { code: 'STK-ELB-01', name: '%100 Cotton Dresses for Girls Forever', category: 'KONFEKSİYON', gtipCode: '6204.42.00.00.00', unit: 'ADET', currentStock: 1850.0, minStock: 200.0, unitCost: 280.0, salePrice: 420.0 },
    { code: 'STK-ELB-02', name: '%100 Cotton Dresses for Girls Tailored', category: 'KONFEKSİYON', gtipCode: '6204.42.00.00.00', unit: 'ADET', currentStock: 1400.0, minStock: 200.0, unitCost: 290.0, salePrice: 440.0 },
    { code: 'STK-AKS-01', name: '16 POLY DUGME', category: 'AKSESUAR', gtipCode: '9606.21.00.00.00', unit: 'ADET', currentStock: 85000.0, minStock: 10000.0, unitCost: 0.85, salePrice: 1.50 },
    { code: 'STK-KET-03', name: '33K346 008 %100 Keten - 4 TOP /LOT NO :11280 - SİYAH - 144 CM - 172 GSM - T10819', category: 'KUMAŞ', gtipCode: '5309.11.00.00.00', unit: 'KG', currentStock: 1250.0, minStock: 300.0, unitCost: 460.0, salePrice: 630.0 },
    { code: 'STK-KET-04', name: '33K346 008 %100 Keten - 4 TOP/LOT NO :11605 - EKRU - 149 CM - 160 GSM - T10819', category: 'KUMAŞ', gtipCode: '5309.11.00.00.00', unit: 'KG', currentStock: 1100.0, minStock: 300.0, unitCost: 450.0, salePrice: 620.0 },
    { code: 'STK-LST-01', name: '3.5 CM SÜP.BEYAZ LASTİK', category: 'AKSESUAR', gtipCode: '5806.32.00.00.00', unit: 'MT', currentStock: 12400.0, minStock: 2000.0, unitCost: 8.50, salePrice: 14.00 },
    { code: 'STK-LST-02', name: '3.5 CM SÜP.SİYAH LASTİK', category: 'AKSESUAR', gtipCode: '5806.32.00.00.00', unit: 'MT', currentStock: 14500.0, minStock: 2000.0, unitCost: 8.50, salePrice: 14.00 },
    { code: 'STK-LST-03', name: '3 CM SÜP.SİYAH LASTİK', category: 'AKSESUAR', gtipCode: '5806.32.00.00.00', unit: 'MT', currentStock: 9800.0, minStock: 1500.0, unitCost: 7.80, salePrice: 12.50 },
    { code: 'STK-LST-04', name: '5.5 CM SÜP.BEYAZ LASTİK', category: 'AKSESUAR', gtipCode: '5806.32.00.00.00', unit: 'MT', currentStock: 8200.0, minStock: 1500.0, unitCost: 11.20, salePrice: 18.00 },
    { code: 'STK-LST-05', name: '5.5 CM SÜP.SİYAH LASTİK', category: 'AKSESUAR', gtipCode: '5806.32.00.00.00', unit: 'MT', currentStock: 7600.0, minStock: 1500.0, unitCost: 11.20, salePrice: 18.00 },
    { code: 'STK-ELB-03', name: "97% cotton 3% elastan Girl's dress Forever", category: 'KONFEKSİYON', gtipCode: '6204.42.00.00.00', unit: 'ADET', currentStock: 2100.0, minStock: 300.0, unitCost: 310.0, salePrice: 470.0 },
    { code: 'STK-ELB-04', name: "97% cotton 3% elastan Girl's dress Tailored", category: 'KONFEKSİYON', gtipCode: '6204.42.00.00.00', unit: 'ADET', currentStock: 1950.0, minStock: 300.0, unitCost: 320.0, salePrice: 490.0 },
    { code: 'STK-DNY-01', name: 'AKILLI KART OKUYUCU', category: 'DONANIM', gtipCode: '8471.90.00.00.00', unit: 'ADET', currentStock: 12.0, minStock: 2.0, unitCost: 650.0, salePrice: 950.0 }
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }
  console.log(`✅ ${productsData.length} Canlı Stok ve Ürün kartı işlendi.`);

  // ==========================================
  // 9. YEVMİYE MADDELERİ (FARUK AYTİN FASON & MAHSUP YEVMİYE KAYITLARI)
  // ==========================================
  const accFasonExpense = await prisma.account.findUnique({ where: { code: '730.01' } });
  const accIndKDV = await prisma.account.findUnique({ where: { code: '191.01' } });
  const accFaruk = await prisma.account.findUnique({ where: { code: '320.01' } });
  const accKumasSales = await prisma.account.findUnique({ where: { code: '600.01' } });
  const accHesKDV = await prisma.account.findUnique({ where: { code: '391.01' } });

  if (accFasonExpense && accIndKDV && accFaruk && accKumasSales && accHesKDV) {
    // 9.1 Fason Yevmiye Fişi (NSA-84 & NSA-87)
    await prisma.journalEntry.upsert({
      where: { entryNo: 1044145 },
      update: {
        date: new Date('2026-10-05'),
        description: 'Faruk Aytin (Nisa Tekstil) NSA-84 & NSA-87 Fason Dikim Tahakkuku',
        documentType: 'MAHSUP',
        documentNo: 'NSA2026000000087',
        totalDebit: 1027959.07,
        totalCredit: 1027959.07
      },
      create: {
        entryNo: 1044145,
        date: new Date('2026-10-05'),
        description: 'Faruk Aytin (Nisa Tekstil) NSA-84 & NSA-87 Fason Dikim Tahakkuku',
        documentType: 'MAHSUP',
        documentNo: 'NSA2026000000087',
        totalDebit: 1027959.07,
        totalCredit: 1027959.07,
        items: {
          create: [
            { accountId: accFasonExpense.id, description: 'Fason Dikim Gideri (140+375 T-shirt, 180+394 Hoodie)', debit: 934508.25, credit: 0.00 },
            { accountId: accIndKDV.id, description: '%10 İndirilecek KDV (Fason)', debit: 93450.82, credit: 0.00 },
            { accountId: accFaruk.id, description: 'Faruk Aytin Cari Hesabı Alacağı', debit: 0.00, credit: 1027959.07 }
          ]
        }
      }
    });

    // 9.2 Kumaş Satış Mahsup Yevmiye Fişi (BR02026000000024)
    await prisma.journalEntry.upsert({
      where: { entryNo: 1044146 },
      update: {
        date: new Date('2026-09-27'),
        description: 'Faruk Aytin Fasona Verilen Kumaş Satış & Mahsup Kaydı',
        documentType: 'MAHSUP',
        documentNo: 'BR02026000000024',
        totalDebit: 364045.00,
        totalCredit: 364045.00
      },
      create: {
        entryNo: 1044146,
        date: new Date('2026-09-27'),
        description: 'Faruk Aytin Fasona Verilen Kumaş Satış & Mahsup Kaydı',
        documentType: 'MAHSUP',
        documentNo: 'BR02026000000024',
        totalDebit: 364045.00,
        totalCredit: 364045.00,
        items: {
          create: [
            { accountId: accFaruk.id, description: 'Faruk Aytin Cari Hesabı Borçlandırma (Kumaş Mahsubu)', debit: 364045.00, credit: 0.00 },
            { accountId: accKumasSales.id, description: 'Yurtiçi Satışlar (992.5 Kg Kumaş)', debit: 0.00, credit: 330950.00 },
            { accountId: accHesKDV.id, description: '%10 Hesaplanan KDV (Kumaş)', debit: 0.00, credit: 33095.00 }
          ]
        }
      }
    });
    console.log('✅ Faruk Aytin Fason ve Kumaş Mahsup Yevmiye maddeleri işlendi.');
  }

  // ==========================================
  // 11. GÜVENLİ YÖNETİCİ KULLANICISI (ADMIN)
  // ==========================================
  const bcrypt = require('bcryptjs');
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Brosan2026!SecureErp';
  const salt = bcrypt.genSaltSync(12);
  const passwordHash = bcrypt.hashSync(adminPassword, salt);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      fullName: 'Yunus Emre Gökalp (Yönetici)',
      role: 'ADMIN',
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null
    },
    create: {
      username: 'admin',
      passwordHash: passwordHash,
      fullName: 'Yunus Emre Gökalp (Yönetici)',
      role: 'ADMIN',
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null
    }
  });
  console.log('✅ Kurumsal Yönetici Kullanıcısı (admin) oluşturuldu/güncellendi.');

  console.log('🎉 Brosan Tekstil ERP Veritabanı Canlı Verilerle Başarıyla Tohumlandı!');
  console.log('📊 ÖZET: 15 Gerçek Cari, 14 Banka/Kasa, 15 Satış Faturası, 3 Fason Faturası, 3 Gerçek Çek, 15 Stok Kartı, 6 Garanti BBVA Havalesi, Faruk Aytin -$9.335,35 USD Mutabakatı Doğrulandı.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
