# 🚀 BROSAN TEKSTİL ERP — COOLIFY BULUT DAĞITIM VE YÖNETİM KILAVUZU

Bu rehber, Brosan Tekstil Muhasebe ve ERP uygulamasını **Coolify** sunucunuz üzerinde sıfırdan kurmak, yapılandırmak ve kesintisiz çalıştırmak için hazırlanmıştır.

---

## 📋 1. Ön Gereksinimler

- **Coolify Sunucusu**: `http://173.249.23.10:8000` (veya sunucu paneliniz)
- **GitHub Reposu**: `https://github.com/yunusemregokalp/brosan-tekstil-muhasebe`
- **Docker İzolasyonu**: Traefik Ters Proxy ve Let's Encrypt SSL

---

## 🛠️ 2. Coolify Üzerinde Kurulum Adımları

### Adım 1: Yeni Proje / Kaynak Oluşturma
1. Coolify panelinize giriş yapın (`Projects` sekmesi).
2. **`Brosan ERP`** veya **`Muhasebe`** adında yeni bir proje seçin ya da oluşturun.
3. `+ New Resource` butonuna tıklayın.
4. Kaynak tipi olarak **`Docker Compose`** seçeneğini belirleyin.
5. Dağıtım kaynağı olarak **`GitHub`** seçin ve repoyu bağlayın:
   - **Repository:** `yunusemregokalp/brosan-tekstil-muhasebe`
   - **Branch:** `main`

### Adım 2: Compose Dosyası Belirleme
Coolify kaynak ayarlarında:
- **Docker Compose Location:** `/docker-compose.coolify.yml` olarak seçin.
- Coolify bu dosyayı okuyarak `postgres` ve `app` servislerini otomatik olarak algılayacaktır.

### Adım 3: Ortam Değişkenleri (Environment Variables)
Coolify panelindeki **`Environment Variables`** sekmesine gidin ve aşağıdaki anahtarları tanımlayın:

| Değişken Adı | Önerilen Değer | Açıklama |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `postgres` | Veritabanı yöneticisi kullanıcı adı |
| `POSTGRES_PASSWORD` | `Brosan2026TekstilSecureDBPass!` | Güçlü veritabanı şifresi |
| `POSTGRES_DB` | `brosan_accounting_db` | Üretim veritabanı adı |
| `COOLIFY_FQDN` | `https://muhasebe.brosan.com` veya `http://173.249.23.10:3000` | Sisteme erişilecek alan adı veya IP |
| `RUN_SEED` | `true` | İlk kurulumda varsayılan TDHP ve cari verileri yükler |
| `NODE_ENV` | `production` | Üretim modu |

> **Önemli Güvenlik Notu:**
> `docker-compose.coolify.yml` dosyasında PostgreSQL portu (`5432`) dış internete kesinlikle açılmaz (`expose: none`). Sadece iç Docker ağı üzerinden `app` konteyneri veritabanına erişebilir. Bu sayede veritabanınız internet korsanlarına ve port taramalarına karşı %100 korumalıdır.

### Adım 4: Dağıtımı Başlatma (Deploy)
1. Sağ üst köşedeki **`Deploy`** butonuna basın.
2. Coolify otomatik olarak:
   - GitHub'dan en güncel kodu çeker.
   - Alpine tabanlı çok aşamalı `Dockerfile` imajını derler.
   - PostgreSQL 16 veritabanını ayağa kaldırır ve sağlık kontrolünü bekler.
   - `prisma db push` çalıştırarak tüm tabloları oluşturur.
   - `seed.js` çalıştırarak hesap planını tohumlar.
   - Traefik SSL sertifikasını üretir.
3. Durum **`Healthy`** olduğunda sistem canlıdadır!

---

## 🔍 3. Sağlık Kontrolü ve Doğrulama

Konteyner ayağa kalktığında terminal veya tarayıcı üzerinden sağlık durumunu teyit edin:

```bash
# Sağlık Kontrolü (HTTP 200 yanıtı beklenir)
curl http://173.249.23.10:3000/api/health

# Yanıt örneği:
# {"status":"healthy","service":"brosan-tekstil-erp","database":"connected","version":"1.0.0"}
```

---

## 🔄 4. Güncelleme ve CI/CD (Otomatik Dağıtım)

GitHub reposuna (`main` dalı) her `git push` yapıldığında:
- Coolify GitHub Webhook entegrasyonu açıksa sistem otomatik olarak yeni sürümü derler ve sıfır kesinti (Zero Downtime) ile yayına alır.
- Veritabanı hacmi (`brosan_cloud_pgdata`) kalıcı olduğundan, hiçbir veri veya cari kaydı silinmez.
