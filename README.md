# 🏭 BROSAN TEKSTİL — ÖN & GENEL MUHASEBE ERP SİSTEMİ

[![GitHub License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?logo=docker&logoColor=white)](Dockerfile)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-%23316192.svg?logo=postgresql&logoColor=white)](prisma/schema.prisma)
[![Node.js](https://img.shields.io/badge/node.js-v20+-green.svg?logo=node.js&logoColor=white)](server/index.js)
[![Coolify](https://img.shields.io/badge/Coolify-Ready-6B46C1.svg)](docker-compose.coolify.yml)

Brosan Tekstil Sanayi ve Ticaret A.Ş. için özel olarak geliştirilmiş; Türk Tekdüzen Hesap Planı (TDHP), E-Fatura/E-Arşiv, Çek/Senet portföyü, Bordro tahakkukları, Kumaş/İplik parti ve GTİP stok takibi ve resmi mali tabloları (Mizan, Bilanço, Gelir Tablosu) tek merkezde toplayan, **PostgreSQL** veritabanı destekli, **Docker & Coolify** bulut altyapısına tam uyumlu kurumsal ERP sistemidir.

---

## 🏗️ Mimari & Teknolojik Altyapı

- **Veritabanı Katmanı**: PostgreSQL 16 Alpine + Prisma ORM (Kalıcı Docker Volume ile sıfır veri kaybı).
- **Backend API**: Node.js & Express REST API (`/api/health`, `/api/accounts`, `/api/journal`, `/api/contacts`, `/api/invoices`, `/api/checks`, `/api/payroll`, `/api/products`, `/api/reports`).
- **Kullanıcı Arayüzü**: 13 Entegre Modül, Tailwind CSS, Google Stitch estetiği, Türkçe tam muhasebe terminolojisi.
- **Konteynerizasyon**: Multi-Stage Alpine `Dockerfile`, `docker-compose.yml` (yerel) ve `docker-compose.coolify.yml` (bulut).
- **Ters Proxy & Güvenlik**: Coolify Traefik entegrasyonu, otomatik Let's Encrypt SSL, izole iç ağ (fail-closed container isolation).

---

## 📦 Temel Modüller

1. **Finans & Nakit Kokpiti**: Kasa (TL, USD, EUR), Banka vadesiz hesapları, anlık nakit durumu ve KPI kartları.
2. **Tekdüzen Hesap Planı (TDHP)**: 100-770 ana ve alt hesap kodları, muavin hesap hiyerarşisi.
3. **Yevmiye Defteri**: Müteselsil fişler, Borç = Alacak çift taraflı kayıt dengesi denetimi.
4. **Cari Hesaplar (Müşteri & Tedarikçi)**: VKN/TCKN, vergi dairesi, ekstreler ve bakiye yaşlandırma.
5. **E-Fatura & E-Arşiv**: Tevkifatlı faturalar, ihracat istisnaları, matrah ve KDV hesaplama motoru.
6. **Kasa & Banka Hareketleri**: Nakit tahsilat/tediye, havale/EFT, cari hesap entegrasyonu.
7. **Çek & Senet Portföyü**: Alınan/verilen çekler, vade takibi, ciro, tahsilat ve karşılıksız durumları.
8. **Personel & Bordro**: Net/Brüt ücret, SGK işçi/işveren payları, gelir/damga vergisi ve asgari ücret istisnası.
9. **Kumaş & İplik Stok Deposu**: Kumaş partileri (Lot no), GTİP kodları (5208, 6006 vb.), birim maliyet.
10. **Vergi Beyanname Takvimi**: KDV-1, KDV-2, Muhtasar ve Prim Hizmet Beyannamesi (MPHB), Geçici Vergi.
11. **Döviz & Kur Değerleme**: TCMB kurları, kur farkı kâr/zarar tahakkuku.
12. **Resmi Mali Raporlar**: Aylık/Dönemlik Mizan, Bilanço (Aktif/Pasif) ve Gelir Tablosu.

---

## 🚀 Hızlı Başlangıç (Yerel Çalıştırma)

### Yöntem A: Docker Compose ile (Önerilen)
```bash
# Servisleri arka planda başlatın
docker compose up -d

# Logları takip edin
docker compose logs -f app

# Tarayıcınızda açın:
# http://localhost:3000
```

### Yöntem B: Node.js ile Doğrudan
```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Prisma istemcisini oluşturun
npm run prisma:generate

# 3. Veritabanı tablolarını güncelleyin ve tohumlayın
npm run prisma:push
npm run prisma:seed

# 4. Sunucuyu başlatın
npm run dev
```

---

## ☁️ Coolify Bulut Dağıtımı

Coolify panelinizde (`http://173.249.23.10:8000`):

1. **Kaynak Ekle**: `+ New Resource` -> `Docker Compose`
2. **Git Kaynağı**: GitHub reposunu seçin: `yunusemregokalp/brosan-tekstil-muhasebe`
3. **Compose Dosyası**: `docker-compose.coolify.yml`
4. **Ortam Değişkenleri**:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=GÜÇLÜ_BİR_ŞİFRE
   POSTGRES_DB=brosan_accounting_db
   COOLIFY_FQDN=https://brosangroup.com/muhasebe
   RUN_SEED=true
   ```
5. **Deploy**: `Deploy` butonuna basın. Birkaç dakika içinde Traefik otomatik SSL sertifikasını alacak ve sistem yayına girecektir. Sistem Ghost Mode ile çalışır (Noindex/Nofollow, arama motorlarında ve kamuya açık dizinlerde asla görünmez).

---

## 🛠️ REST API Uç Noktaları

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Konteyner ve veritabanı sağlık kontrolü |
| `GET` | `/api/summary` | Dashboard KPI ve finansal özet metrikleri |
| `GET/POST`| `/api/accounts` | Hesap planı listeleme ve yeni hesap kartı açma |
| `GET/POST`| `/api/journal` | Yevmiye fişleri (Borç=Alacak doğrulamalı) |
| `GET/POST`| `/api/contacts` | Cari hesap kartları (Müşteri & Tedarikçi) |
| `GET/POST`| `/api/invoices` | Fatura oluşturma ve cari bakiye güncelleme |
| `GET/POST`| `/api/transactions` | Kasa ve banka para hareketleri |
| `GET/POST`| `/api/checks` | Çek ve senet portföyü |
| `PATCH` | `/api/checks/:id/status` | Çek durum güncellemesi (Tahsil/Ciro/Karşılıksız) |
| `GET/POST`| `/api/employees` | Personel kartları ve bordro tahakkukları |
| `GET/POST`| `/api/products` | Kumaş/İplik stok kartları ve depo hareketleri |
| `GET` | `/api/reports/mizan` | Dinamik hesap mizanı |

---

## 📄 Lisans
Bu yazılım Brosan Tekstil Sanayi ve Ticaret A.Ş. için özel mülk olarak üretilmiştir.
Tüm hakları saklıdır © 2026.
