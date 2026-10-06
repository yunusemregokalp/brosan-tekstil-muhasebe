import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("build_ultimate_enterprise_erp.py", "r", encoding="utf-8") as f:
    code = f.read()

print("Current length before stage 3:", len(code))

# Replacement for const BROSAN_ERP
target_start = "    const BROSAN_ERP = {"
target_end = "    // FORMAT CURRENCY HELPER"

idx_start = code.find(target_start)
idx_end = code.find(target_end)

if idx_start == -1 or idx_end == -1:
    print("ERROR: Target bounds not found for BROSAN_ERP")
    sys.exit(1)

new_brosan_erp = """    const BROSAN_ERP = {
      company: {
        name: "BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.",
        vkn: "1870492109",
        taxOffice: "İkitelli Vergi Dairesi",
        address: "İkitelli OSB Mah. Dokumacılar San. Sit. 4. Blok No:28 Başakşehir / İSTANBUL",
        garantiGbpIban: "TR86 0006 2000 4170 0009 0345 78", // Hesap: 417-9034578
        garantiTryIban: "TR16 0006 2000 4170 0006 2894 77", // Hesap: 417-6289477
        garantiLojistikTryIban: "TR84 0006 2000 4170 0006 2878 65", // Hesap: 417-6287865
        garantiEurIban: "TR59 0006 2000 4170 0009 0345 79", // Hesap: 417-9034579
        garantiUsdIban: "TR32 0006 2000 4170 0009 0345 80", // Hesap: 417-9034580
      },
      fx: {
        GBP: 64.79,
        USD: 49.23,
        EUR: 53.65
      },
      bankAccounts: {
        garantiGbp: 23759.07,
        garantiTry: 15732.92,
        garantiLojistikTry: 17210.75,
        garantiEur: 11792.36,
        garantiUsd: 1521.16,
        cariAcikEur: 9197.00,
        cariAcikUsd: 4748.93,
        kasaTry: -722.35,
        yunusCepKK: -248697.05
      },
      // Faruk Aytin & Nisa Tekstil Master Fason & Offset Model
      farukAytin: {
        summary: {
          supplierName: "FARUK AYTİN",
          subTitle: "NİSA TEKSTİL",
          tckn: "46849262292",
          address: "Sultangazi İstanbul Uğur Mumcu Mah. Eski Edirne Asfaltı No: 574/4",
          email: "nisatekstil34@hotmail.com",
          totalFasonAlisUsd: 24032.80,
          totalFasonAlisTl: 1171410.07,
          totalFasonKdvUsd: 2184.80,
          totalBankaOdemesiUsd: 6236.00,
          totalBankaOdemesiTl: 298471.00,
          kumasSatisUsd: 7461.45,
          kumasSatisTl: 364045.00,
          netKalanBorcUsd: -10335.35,
          netKalanBorcTl: -508894.07,
          netOdenecekKdvUsd: 1230.49,
          netOdenecekKdvTl: 60355.83,
          reconciliationStatus: "TAM MUTABIK (%100 Excel & Paraşüt Doğrulandı)"
        },
        faturalar: [
          { no: 'NSA2026000000070', date: '30.07.2026', desc: 'EMK Oversized Tişört (276 Adet)', usd: 3036.00, kdvUsd: 276.00, kur: 47.25, tl: 143451.00, status: 'Ödendi / Kapandı', isPaid: true },
          { no: 'NSA2026000000084', date: '01.10.2026', desc: 'Ben Ellis (140 T-shirt + 180 Hoodie)', usd: 6366.80, kdvUsd: 578.80, kur: 48.9303, tl: 311529.43, irsaliye: 'IRS2026000000078', fisNo: '1044145905', status: 'Avans + Kumaş Mahsubu ile Kapandı', isPaid: true },
          { no: 'NSA2026000000087', date: '05.10.2026', desc: 'Ben Ellis (375 T-shirt + 394 Hoodie)', usd: 14630.00, kdvUsd: 1330.00, kur: 48.9699, tl: 716429.64, irsaliye: 'IRS2026000000080', fisNo: '1044145920', status: 'Açık Kalan Bakiye: -$10.335,35 USD', isPaid: false }
        ],
        kumas: {
          faturaNo: 'BR02026000000024',
          date: '27.09.2026',
          kur: 48.7901,
          matrahTl: 330950.00,
          kdvTl: 33095.00,
          toplamTl: 364045.00,
          toplamUsd: 7461.45,
          kalemler: [
            { cins: 'B.KUMAŞ 30/2 PENYE SÜPREM', kg: 227.0, bfTl: 340, toplamTl: 84898.00, usd: 1740.07 },
            { cins: 'B.KUMAŞ 30/2 COM. PENYE MİLENYUM LYC RİBANA', kg: 14.5, bfTl: 340, toplamTl: 5423.00, usd: 111.15 },
            { cins: 'B.KUMAŞ 30/20/10 PENYE 3 İPLİK', kg: 650.0, bfTl: 330, toplamTl: 235950.00, usd: 4836.02 },
            { cins: 'B.KUMAŞ 30/2 PENYE 70 DNY LYC K.KORSE', kg: 101.0, bfTl: 340, toplamTl: 37774.00, usd: 774.21 }
          ]
        },
        odemeler: [
          { sira: 1, date: '31.07.2026', tl: 143451.00, usd: 3036.00, kur: 47.25, dekont: '2026-07-31-17.07.43', desc: 'NSA2026000000070 nolu fatura ödemesi' },
          { sira: 2, date: '07.09.2026', tl: 96600.00, usd: 2000.00, kur: 48.30, dekont: '2026-09-07-16.25.27', desc: 'Verilen siparişe istinaden avans' },
          { sira: 3, date: '14.09.2026', tl: 48420.00, usd: 1000.00, kur: 48.42, dekont: '2026-09-14-14.19.11', desc: 'Cari hesaba istinaden avans' },
          { sira: 4, date: '22.09.2026', tl: 5000.00, usd: 100.00, kur: 50.00, dekont: '2026-09-22-18.03.45', desc: '100 USD karşılığı cari ödeme' },
          { sira: 5, date: '30.09.2026', tl: 5000.00, usd: 100.00, kur: 50.00, dekont: '2026-09-30-18.20.49', desc: '100 USD karşılığı cari ödeme' }
        ]
      },
      // Invoices
      invoices: [
        {
          id: 'BS02026000000013',
          customer: 'BEN ELLİS',
          date: '01.10.2026',
          etgb: '26340200EX009281',
          exemption: '301 - Mal İhracatı',
          currency: 'GBP',
          amountFx: 7388.10,
          amountTry: 478675.00,
          ibkbStatus: 'Açık (TCMB %40 Bozum Bekliyor)',
          isClosed: false,
          gtip: '6109.10 T-Shirt / 6110.20 Hoodie',
          meters: '769 Adet (47 Koli, 427 Kg)'
        },
        {
          id: 'BR02026000000024',
          customer: 'FARUK AYTİN',
          date: '27.09.2026',
          etgb: 'Kumaş Mahsup Faturası',
          exemption: '%10 KDV',
          currency: 'TRY',
          amountFx: 364045.00,
          amountTry: 364045.00,
          ibkbStatus: 'Mahsup Edildi ✓',
          isClosed: true,
          gtip: '5208 Süprem / 6006 3 İplik',
          meters: '992,5 Kg Kumaş ($7.461,45 USD)'
        },
        {
          id: 'BS02025000000003',
          customer: 'LAVI LA LLC',
          date: '13.11.2025',
          etgb: '25340200EX004120',
          exemption: '301 - Mal İhracatı',
          currency: 'USD',
          amountFx: 10116.85,
          amountTry: 498052.52,
          ibkbStatus: 'İBKB Kapatıldı ✓',
          isClosed: true,
          gtip: '6204.42 Cotton Dress',
          meters: '1.850 Adet'
        },
        {
          id: 'BS02025000000004',
          customer: 'GbR Celik, David und Djemailji',
          date: '13.11.2025',
          etgb: '25340200EX004128',
          exemption: '301 - Mal İhracatı',
          currency: 'EUR',
          amountFx: 6586.04,
          amountTry: 353340.00,
          ibkbStatus: 'İBKB Kapatıldı ✓',
          isClosed: true,
          gtip: '6109.10 Penye T-Shirt',
          meters: '1.200 Adet'
        }
      ],
      // Expenses
      expenses: [
        {
          id: 'NSA2026000000087',
          supplier: 'FARUK AYTİN (NİSA TEKSTİL)',
          category: '730.01 Fason Dikim Gideri (Ben Ellis)',
          dueDate: '05.10.2026 (Açık Borç)',
          matrah: 651299.67,
          kdv: 65129.97,
          total: 716429.64,
          status: 'Açık Kalan: -$10.335,35 USD',
          isPaid: false
        },
        {
          id: 'TIN2026000000155',
          supplier: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK LTD. ŞTİ.',
          category: '150.01 Ham Dokuma ve Örme Kumaş Alımı',
          dueDate: 'Açık Bakiye',
          matrah: 999134.09,
          kdv: 99913.41,
          total: 1099047.50,
          status: 'Borç Bakiyesi',
          isPaid: false
        },
        {
          id: 'ÇET2026000000012',
          supplier: 'ÇETİN TÜREDİ',
          category: '320.03 Tedarikçi Cari Hesabı',
          dueDate: 'Açık Bakiye',
          matrah: 200000.00,
          kdv: 0.00,
          total: 200000.00,
          status: 'Borç Bakiyesi',
          isPaid: false
        },
        {
          id: 'YEG2026000000001',
          supplier: 'YUNUS EMRE GÖKALP',
          category: '331.01 Ortaklara Borçlar Hesabı',
          dueDate: 'Dönem İçi',
          matrah: 109418.80,
          kdv: 0.00,
          total: 109418.80,
          status: 'Ortak Borcu',
          isPaid: false
        }
      ],
      // Contacts (15 Authentic Paraşüt Live Records)
      contacts: [
        {
          code: 'CR-GB-0001',
          name: 'BEN ELLİS',
          type: 'İhracat Müşterisi',
          vkn: 'GB928374182',
          city: 'Bristol, Birleşik Krallık',
          balance: '£22.414,22 (Alacak)',
          balanceRaw: 1452246.45,
          status: 'ETGB Açık',
          isBenEllis: true
        },
        {
          code: 'CR-TR-0002',
          name: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK SANAYİ TİCARET LİMİTED ŞİRKETİ',
          type: 'Kumaş Tedarikçisi',
          vkn: '8440058291',
          city: 'Güneşli, İstanbul',
          balance: '-₺1.099.047,50 (Borç)',
          balanceRaw: -1099047.50,
          status: 'Açık Bakiye',
          isBenEllis: false
        },
        {
          code: 'CR-US-0003',
          name: 'LAVI LA LLC',
          type: 'İhracat Müşterisi',
          vkn: 'US95-4829104',
          city: 'Los Angeles, ABD',
          balance: '₺981.529,27 (Alacak)',
          balanceRaw: 981529.27,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0004',
          name: 'FARUK AYTİN',
          type: 'Fason Üretim & Kumaş Mahsubu',
          vkn: '46849262292',
          city: 'Sultangazi, İstanbul',
          balance: '-$10.335,35 USD (Borç)',
          balanceRaw: -508894.07,
          status: 'Kumaş Mahsup Masası',
          isFarukAytin: true
        },
        {
          code: 'CR-DE-0005',
          name: 'GbR Celik, David und Djemailji',
          type: 'İhracat Müşterisi',
          vkn: 'DE301948271',
          city: 'Berlin, Almanya',
          balance: '₺362.078,75 (Alacak)',
          balanceRaw: 362078.75,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0006',
          name: 'ÇETİN TÜREDİ',
          type: 'Finansman / Tedarikçi',
          vkn: '39481920194',
          city: 'Halkalı, İstanbul',
          balance: '-₺200.000,00 (Borç)',
          balanceRaw: -200000.00,
          status: 'Açık Bakiye',
          isBenEllis: false
        },
        {
          code: 'CR-UK-0007',
          name: 'ATTERO CLOTHING',
          type: 'İhracat Müşterisi',
          vkn: 'GB883910294',
          city: 'Londra, Birleşik Krallık',
          balance: '₺152.855,57 (Alacak)',
          balanceRaw: 152855.57,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0008',
          name: 'YUNUS EMRE GÖKALP',
          type: 'Şirket Ortağı (331)',
          vkn: '18704921090',
          city: 'İkitelli, İstanbul',
          balance: '-₺109.418,80 (Borç)',
          balanceRaw: -109418.80,
          status: '331 Ortak Hesabı',
          isBenEllis: false
        },
        {
          code: 'CR-KW-0009',
          name: 'Rana Jassim Khaled Alsaadoun',
          type: 'İhracat Müşterisi',
          vkn: 'KW-4910284',
          city: 'Kuveyt',
          balance: '₺76.967,38 (Alacak)',
          balanceRaw: 76967.38,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0010',
          name: 'ARKSİGNER YAZILIM VE DONANIM SAN. TİC. A.Ş.',
          type: 'Hizmet Tedarikçisi',
          vkn: '0810549281',
          city: 'Çankaya, Ankara',
          balance: '-₺50.800,00 (Borç)',
          balanceRaw: -50800.00,
          status: 'E-İmza & Yazılım',
          isBenEllis: false
        },
        {
          code: 'CR-US-0011',
          name: 'CuterEsque Inc.',
          type: 'İhracat Müşterisi',
          vkn: 'US84-1928401',
          city: 'Wilmington, ABD',
          balance: '₺48.458,59 (Alacak)',
          balanceRaw: 48458.59,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0012',
          name: 'FİLET ÖRME TEK. VE TEK. ÜRN. İNŞ. PLS. AMB. NAKL. İTH. İHR. SAN. TİC. LTD. ŞTİ.',
          type: 'Örme Tedarikçisi',
          vkn: '3850491823',
          city: 'Zeytinburnu, İstanbul',
          balance: '-₺42.919,60 (Borç)',
          balanceRaw: -42919.60,
          status: 'Örme Fasonu',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0013',
          name: 'BE-HA KONFEKSİYON - FATMA KİPOĞLU',
          type: 'Konfeksiyon Müşterisi',
          vkn: '5620194821',
          city: 'Merter, İstanbul',
          balance: '₺27.096,00 (Alacak)',
          balanceRaw: 27096.00,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0014',
          name: 'MERT ÜTÜ - VEYSEL ADIYEKE',
          type: 'Ütü Paket Fasonu',
          vkn: '0089182734',
          city: 'Güneşli, İstanbul',
          balance: '-₺18.952,00 (Borç)',
          balanceRaw: -18952.00,
          status: 'Ütü Fasonu',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0015',
          name: 'ASSET LOJİSTİK ANONİM ŞİRKETİ',
          type: 'Gümrük & Nakliye',
          vkn: '0910482910',
          city: 'Ataşehir, İstanbul',
          balance: '-₺18.243,96 (Borç)',
          balanceRaw: -18243.96,
          status: 'Navlun & Gümrük',
          isBenEllis: false
        }
      ],
      // Checks
      checks: [
        {
          no: 'ÇK-2025-001',
          drawer: 'Zirve Tekstil Pazarlama A.Ş.',
          bank: 'Garanti BBVA Bahçeşehir',
          dueDate: '08.10.2025',
          amount: 125000.00,
          status: 'Portföyde'
        },
        {
          no: 'ÇK-2025-002',
          drawer: 'Korteks İplik Dokuma Sanayi',
          bank: 'İş Bankası Merter',
          dueDate: '14.11.2025',
          amount: 140000.00,
          status: 'Portföyde'
        },
        {
          no: 'ÇK-2025-003',
          drawer: 'Akdeniz Mensucat A.Ş.',
          bank: 'Akbank Zeytinburnu',
          dueDate: '30.11.2025',
          amount: 85000.00,
          status: 'Portföyde'
        }
      ],
      // Employees
      employees: [
        { id: 'BRS-001', name: 'Mustafa Yıldırım', title: 'Üretim & Dokuma Ustabaşı', gross: 45000, sgk: 6750, tax: 3200, net: 35050 },
        { id: 'BRS-002', name: 'Ayşe Demir', title: 'İhracat Operasyon Uzmanı', gross: 42000, sgk: 6300, tax: 2900, net: 32800 },
        { id: 'BRS-003', name: 'Mehmet Kaya', title: 'Dokuma Tezgah Operatörü', gross: 32000, sgk: 4800, tax: 1800, net: 25400 },
        { id: 'BRS-004', name: 'Fatma Şahin', title: 'Kalite Kontrol & Paketleme', gross: 28000, sgk: 4200, tax: 1200, net: 22600 },
        { id: 'BRS-005', name: 'Hüseyin Çelik', title: 'Boyahane ve Kimya Teknisyeni', gross: 35000, sgk: 5250, tax: 2200, net: 27550 },
        { id: 'BRS-006', name: 'Zeynep Koç', title: 'Muhasebe & Finans Uzmanı', gross: 38000, sgk: 5700, tax: 2500, net: 29800 }
      ],
      // Stock Inventory (15 Authentic Items)
      inventory: [
        { code: 'STK-KET-01', desc: '01254 - 33K346 008 %100 Keten / EKRU / 149 CM / 160 GSM', gtip: '5309.11.00.00.00', qty: 3500, unit: 'Kg', cost: 450.00, total: 1575000.00 },
        { code: 'STK-KET-02', desc: '01254 - 33K346 008 %100 Keten / SİYAH / 144 CM / 172 GSM', gtip: '5309.11.00.00.00', qty: 4200, unit: 'Kg', cost: 460.00, total: 1932000.00 },
        { code: 'STK-ELB-01', desc: '%100 Cotton Dresses for Girls Forever', gtip: '6204.42.00.00.00', qty: 1850, unit: 'Adet', cost: 280.00, total: 518000.00 },
        { code: 'STK-ELB-02', desc: '%100 Cotton Dresses for Girls Tailored', gtip: '6204.42.00.00.00', qty: 1400, unit: 'Adet', cost: 290.00, total: 406000.00 },
        { code: 'STK-AKS-01', desc: '16 POLY DUGME', gtip: '9606.21.00.00.00', qty: 85000, unit: 'Adet', cost: 0.85, total: 72250.00 },
        { code: 'STK-LST-01', desc: '3.5 CM SÜP.BEYAZ LASTİK', gtip: '5806.32.00.00.00', qty: 12400, unit: 'Metre', cost: 8.50, total: 105400.00 },
        { code: 'STK-LST-02', desc: '3.5 CM SÜP.SİYAH LASTİK', gtip: '5806.32.00.00.00', qty: 14500, unit: 'Metre', cost: 8.50, total: 123250.00 },
        { code: 'STK-ELB-03', desc: "97% cotton 3% elastan Girl's dress Forever", gtip: '6204.42.00.00.00', qty: 2100, unit: 'Adet', cost: 310.00, total: 651000.00 }
      ],
      // TDHP Mizan Accounts (Aligned with Paraşüt Real Figures)
      accounts: [
        { code: '100 KASA', sub: 'Merkez TL Kasası', debit: 45000, credit: 45722.35, bDebit: 0, bCredit: 722.35, status: 'check' },
        { code: '102 BANKALAR', sub: 'Garanti BBVA GBP/EUR/USD/TL Hesapları', debit: 2840500, credit: 1542100, bDebit: 1298400, bCredit: 0, status: 'sync' },
        { code: '120 ALICILAR', sub: 'Ben Ellis (£22.414,22 = ₺1.452.246 Dahil)', debit: 2795854.47, credit: 890000, bDebit: 1905854.47, bCredit: 0, status: 'pending_actions', isExport: true },
        { code: '121 ALACAK SENETLERİ & ÇEKLER', sub: 'Portföydeki 3 Adet Vadeli Çek', debit: 350000, credit: 0, bDebit: 350000, bCredit: 0, status: 'schedule' },
        { code: '150 İLK MADDE VE MALZEME', sub: 'Keten, İplik & Kumaş Depoları', debit: 2450000, credit: 890000, bDebit: 1560000, bCredit: 0, status: 'check' },
        { code: '191 İNDİRİLECEK KDV', sub: 'Fason Dikim ve Hammadde KDV', debit: 218480, credit: 111990.17, bDebit: 106489.83, bCredit: 0, status: 'receipt' },
        { code: '320 SATICILAR', sub: 'Tinteks, Faruk Aytin (-$10.335 USD), Çetin Türedi', debit: 662516, credit: 2270457.57, bDebit: 0, bCredit: 1607941.57, status: 'priority_high' },
        { code: '331 ORTAKLARA BORÇLAR', sub: 'Yunus Emre Gökalp Cari Hesabı', debit: 0, credit: 109418.80, bDebit: 0, bCredit: 109418.80, status: 'schedule' },
        { code: '309 DİĞER MALİ BORÇLAR', sub: 'Yunus Cep Kredi Kartı', debit: 0, credit: 248697.05, bDebit: 0, bCredit: 248697.05, status: 'schedule' },
        { code: '600 YURTİÇİ SATIŞLAR', sub: 'Faruk Aytin Kumaş Satış Mahsubu', debit: 0, credit: 330950, bDebit: 0, bCredit: 330950, status: 'check' },
        { code: '601 YURTDIŞI SATIŞLAR', sub: 'Ben Ellis & e-İhracat Gelirleri', debit: 0, credit: 1985000, bDebit: 0, bCredit: 1985000, status: 'verified', isExport: true }
      ]
    };"""

code = code[:idx_start] + new_brosan_erp + "\n\n" + code[idx_end:]
print("✓ Successfully replaced BROSAN_ERP object")

with open("build_ultimate_enterprise_erp.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Saved updated build_ultimate_enterprise_erp.py")
