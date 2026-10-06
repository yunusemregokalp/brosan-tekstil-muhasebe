# Original User Request

## 2026-10-06T21:15:48Z

Requested team: Full team (DevOps, Database, Accounting Domain)

Paraşüt muhasebe programından (Şirket ID: 794187) canlı olarak çekilen gerçek cariler, e-faturalar, banka hesapları, çekler ve stok verileri ile `FARUK AYTİN CARİ.xlsx` dosyasındaki fason üretim/kumaş mahsubu mutabakatını Brosan ERP sistemine ve PostgreSQL veritabanına entegre etmek.

Working directory: C:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Paraşüt Canlı Muhasebe Verilerinin Veritabanına ve ERP Çekirdeğine Entegrasyonu
Paraşüt canlı API'sinden çekilen 15 adet gerçek cari kartı (BEN ELLİS, TİNTEKS, LAVI LA LLC, FARUK AYTİN, ATTERO CLOTHING vb.), 14 adet kasa/banka hesabı (Garanti BBVA TL, USD, EUR, GBP hesapları ve IBAN'ları), 15 adet satış faturası ve portföydeki vadeli çekler PostgreSQL `prisma/seed.js` tohumlamasına ve `app/index.html` önbellek durumuna aktarılmalıdır.

### R2. Faruk Aytin & Nisa Tekstil Fason Üretim ve Kumaş Mahsubu Masası
`FARUK AYTİN CARİ.xlsx` ve Paraşüt verileri (Fiş No: 1044145905 ve 1044145920) baz alınarak; NSA-70, NSA-84, NSA-87 fason faturaları, Brosan'ın kestiği BR02026000000024 nolu kumaş satış faturası ($7.461,45 USD / 364.045,00 TL) ve Garanti BBVA banka havaleleri (toplam 298.471,00 TL / $6.236,00 USD) ile mutabakat tablosu oluşturulmalı, net kalan borç tutarı olan **$10.335,35 USD** (508.894,07 TL) ve ödenecek net KDV $1.230,49 USD kuruşu kuruşuna doğrulanmalıdır.

### R3. Canlı Paraşüt & Excel Verisi ile Tam Çift Yönlü Mutabakat Denetimi
Brosan ERP kokpiti, hem Paraşüt'teki gerçek bakiyelerle (Tedarikçi borçları, cari alacaklar, banka nakitleri) hem de Excel çalışma kağıtlarıyla birebir örtüşmeli; hiçbir yapay veya eksik veri kalmamalıdır.

### R4. Coolify & GitHub Otomatik Dağıtımı
Tüm veritabanı şeması ve seed güncellemeleri Git'e commit edilip GitHub'a aktarılmalı, Coolify üzerindeki üretim sunucusunda konteynerler yeniden derlenip başarıyla ayağa kaldırılmalıdır.

## Acceptance Criteria

### Veri Doğruluğu ve Bütünlüğü
- [ ] Paraşüt'teki 15 cari kartı (VKN/TCKN, adres, para birimleri ve döviz bakiyeleri) PostgreSQL veritabanında yer almalı.
- [ ] Faruk Aytin net borç bakiyesi hem arayüzde hem de veritabanında tam **-$10.335,35 USD** olarak görünmeli.
- [ ] Garanti BBVA 417-6289477 (TL: ₺15.732,92), 417-9034578 (GBP: £23.759,07), 417-9034579 (EUR: €11.792,36), 417-9034580 (USD: $1.521,16) gerçek hesapları sisteme tanımlanmalı.
- [ ] Ben Ellis cari bakiyesi Paraşüt ile uyumlu olarak **£22.414,22 GBP** olarak işlenmeli.

### Dağıtım ve Çalışma Garantisi
- [ ] `npm run build` veya `npx prisma db seed` komutları sıfır hata ile tamamlanmalı.
- [ ] Coolify üzerinde üretim konteyneri `Status: Success` durumunda çalışmalı.
