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


## 2026-10-08T21:01:31Z

Implement Phase 3 Ultimate Citadel security hardening for Brosan Tekstil ERP at https://brosangroup.com/muhasebe, incorporating real-time security threat alerting (Telegram/Webhook), application-layer AES-256-GCM field encryption for sensitive banking & contact credentials, and an administrative emergency panic lockdown killswitch.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Real-Time Asynchronous Security Threat & Quarantine Alerter
Implement an asynchronous, non-blocking notification dispatcher in `server/threatAlerter.js` that triggers on critical security events (IP_QUARANTINED, BRUTE_FORCE_LOCKOUT, REPLAY_ATTACK, SENSITIVE_PROBE). Support webhook and Telegram bot notification payloads without impeding request throughput or leaking sensitive payload data.

### R2. Application-Layer AES-256-GCM Field-Level Cryptography
Implement a robust AES-256-GCM cryptographic vault in `server/cryptoVault.js` with authenticated encryption (ciphertext + 96-bit IV + 128-bit auth tag). Apply field-level encryption for sensitive database attributes (bank IBANs, account numbers, and tax identification numbers) ensuring that raw database dumps are completely unreadable without the 256-bit runtime key.

### R3. Administrative Emergency Panic Lockdown Switch
Implement an emergency lockdown mechanism (`server/lockdown.js`) reachable via an authenticated master endpoint (`/api/auth/emergency-lockdown`) and CLI trigger. Upon activation, instantly revoke 100% of issued JWT tokens, activate read-only maintenance mode, drop all mutating API calls with HTTP 503 SYSTEM_IN_LOCKDOWN, and require an administrative master recovery phrase to restore normal operations.

### R4. Automated Adversarial Red-Team Verification & Coolify Production Deployment
Develop an automated test suite verifying threat alert dispatching, AES-256-GCM encryption/decryption roundtrips, and emergency lockdown enforcement. Deploy the build to Coolify production on VPS 173.249.23.10 and verify zero-regression on active services like https://brosangroup.com/callcenter/landing.

## Acceptance Criteria

### Real-Time Threat Alerter
- [ ] Critical events (IP_QUARANTINED, REPLAY_ATTACK) automatically enqueue a structured alert payload.
- [ ] Network dispatching is fully asynchronous and fails silently without disrupting incoming HTTP requests.
- [ ] Alert messages contain event type, client IP, timestamp, and sanitized incident summary with zero credential leakage.

### AES-256-GCM Field Cryptography
- [ ] Plaintext IBANs and account numbers are encrypted using AES-256-GCM with unique random IVs per record.
- [ ] Tampered ciphertexts or invalid authentication tags are rejected with cryptographic integrity errors.
- [ ] Reading encrypted fields seamlessly decrypts them for authenticated administrative views.

### Emergency Panic Lockdown Switch
- [ ] Activating lockdown immediately invalidates all active sessions and sets system state to LOCKED.
- [ ] During lockdown, all mutating requests (POST, PUT, DELETE, PATCH) are rejected with HTTP 503 SYSTEM_IN_LOCKDOWN.
- [ ] Restoring system requires valid master recovery key, resetting security posture cleanly.

### Deployment & Pipeline Health
- [ ] All unit, red-team penetration, and E2E security test suites pass with 100% success rate.
- [ ] Production deployment builds and runs healthy under non-root user `node` (UID 1000).
- [ ] `https://brosangroup.com/callcenter/landing` remains fully operational (HTTP 200).


## 2026-10-09T09:45:45Z

Implement Phase 4 Ironclad Zero-Trust defense-in-depth security hardening for Brosan Tekstil ERP at https://brosangroup.com/muhasebe, incorporating in-flight heuristic WAF payload inspection (SQLi/XSS/NoSQLi/Prototype Pollution), cryptographic session fingerprint binding (anti-session hijacking), and a tamper-evident HMAC financial ledger audit chain.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Deep In-Flight Heuristic WAF & Malicious Payload Sanitizer
Implement an in-flight request inspection engine in `server/heuristicWaf.js` that recursively analyzes `req.body`, `req.query`, and `req.params`. Detect SQL injection patterns (`UNION SELECT`, `' OR '1'='1`, `SLEEP()`), NoSQL operators (`$gt`, `$ne`, `$regex`), XSS injection (`<script>`, event handlers, `javascript:`), Prototype Pollution (`__proto__`, `constructor`), and Path Traversal (`../`, `%2e%2e`). Reject violations immediately with HTTP 403 `MALICIOUS_PAYLOAD_DETECTED`, quarantine the offending IP in `quarantineEngine`, alert via `threatAlerter`, and record the incident in SIEM `security-audit.log`.

### R2. Cryptographic Session Fingerprint Binding (Anti-Session Hijacking)
Implement session fingerprinting in `server/sessionGuard.js` that binds every issued JWT to the client's network identity (HMAC-SHA256 of Client IP subnet + User-Agent + Accept-Language salt). On every authenticated request, verify the session fingerprint in constant time. If a stolen JWT is used from a different IP or device, reject immediately with HTTP 401 `SESSION_HIJACK_DETECTED`, revoke the token in `revoked_tokens.json`, quarantine the attacker IP, and alert administrators.

### R3. Tamper-Evident Financial HMAC Audit Blockchain / Chained Ledger
Implement a cryptographic hash chain in `server/ledgerIntegrity.js` for journal entries and financial transactions where each record computes `entry_hash = HMAC(prev_hash || record_id || amount || type || timestamp)`. Provide an authenticated verification endpoint (`/api/audit/verify-integrity`) that validates chain continuity from genesis to head, guaranteeing that direct database tampering or rogue modifications are immediately detected.

### R4. Automated Adversarial Red-Team Verification & Coolify Production Deployment
Develop a comprehensive unit and adversarial red-team penetration suite verifying Heuristic WAF payload interception, session fingerprint rejection on stolen tokens, and ledger chain tamper detection with a 100% pass threshold. Deploy the build to Coolify production on VPS 173.249.23.10 and verify zero regression on `https://brosangroup.com/callcenter/landing`.

## Acceptance Criteria

### Heuristic WAF & Payload Inspection
- [ ] Payloads containing SQLi, NoSQLi, XSS, prototype pollution, or path traversal are rejected with HTTP 403 `MALICIOUS_PAYLOAD_DETECTED`.
- [ ] Offending client IP is immediately quarantined in `quarantineEngine` and an incident alert is enqueued in `threatAlerter`.
- [ ] Benign legitimate Turkish text and accounting inputs pass cleanly without false positives.

### Anti-Session Hijacking (Fingerprint Binding)
- [ ] JWT tokens contain an HMAC-SHA256 client fingerprint claim.
- [ ] Requests using a valid JWT from a differing IP subnet or User-Agent are rejected with HTTP 401 `SESSION_HIJACK_DETECTED`.
- [ ] Hijacked token is instantly revoked, and the incident is logged in `security-audit.log`.

### Financial Ledger Integrity Chain
- [ ] Every financial transaction record is linked to the previous record via cryptographic HMAC hash.
- [ ] Direct database modification (tampering with an amount or date) fails chain verification.
- [ ] `/api/audit/verify-integrity` returns `isValid: true` for unaltered records and reports exact tamper points if compromised.

### Deployment & Stability
- [ ] All unit, red-team penetration, and E2E security test suites pass with 100% success rate.
- [ ] Production deployment on Coolify runs healthy under non-root user `node` (UID 1000).
- [ ] `https://brosangroup.com/callcenter/landing` remains fully operational (HTTP 200 OK).


## 2026-10-09T16:49:34Z

Build and deploy an ultra-fast, parallelized Cari Transaction Engine and an undisputed world-class financial design (Haute Finance / Swiss Private Banking tier) for Brosan Tekstil's Faruk Aytin (and future counterparties) Cari Ekstre & Mutabakat dossier.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Sub-2s Parallel Execution Engine
Accelerate the single-command CLI engine (scripts/brosan_cari_engine.py) using concurrent multi-threading (ThreadPoolExecutor), optimized Chromium flags (--headless, zero-delay compositor, stripped network overhead), and pre-cached assets. The entire 5-deliverable compilation (Master Excel, 1-Page Executive PDF, 2-Page Audit Dossier PDF, Interactive Web Dashboard, and Desktop Batch Launcher) must complete in under 4.5 seconds end-to-end.

### R2. Haute Finance / Swiss Executive Design Standard (World-Class Tier)
Elevate the visual design across both vector PDFs (A4 Landscape) and the Interactive Web Dashboard (FARUK_AYTIN_EKSTRE_PANELI.html):
- Typography & Geometry: Strict baseline grid with Plus Jakarta Sans and JetBrains Mono tabular lining figures (font-variant-numeric: tabular-nums). Hairline borders (0.5pt), calibrated padding, micro-metric indicators (▲, ▼, ✓), and security Guilloche / audit line accents.
- Visual Palette: Deep executive obsidian (#0F172A), warm parchment background tinting (#F8FAFC, #F1F5F9), subtle emerald credit badges (#059669, #ECFDF5), and crisp borders (#CBD5E1).
- Interactive QR & Security Seal: Embed a vector/SVG cryptographic audit QR code verifying the document hash and protocol reference, integrated with the high-resolution Brosan corporate seal and bilateral TTK m.94 acknowledgment.
- Zero-Clipping Vertical Budgeting: Flawless, mathematically budgeted page heights ensuring zero table overflow, perfectly aligned signature bays, and balanced audit desks.

### R3. Atomic Multi-Format Output
Every execution must update and synchronize in one atomic pass:
1. FARUK AYTİN CARİ.xlsx (Formula-driven, openpyxl, print-configured)
2. FARUK AYTİN CARİ EKSTRE.pdf (1-page executive summary, vector PDF)
3. FARUK AYTİN CARİ MUTABAKAT DOSYASI (TAM SET).pdf (2-page complete audit dossier, vector PDF)
4. FARUK_AYTIN_EKSTRE_PANELI.html (Interactive web panel with search, filters, and WhatsApp copy)
5. 1_TIKLA_AC_VE_WHATSAPP_KOPYALA.bat (1-click desktop batch launcher)

## Acceptance Criteria

### Performance & Speed
- [ ] End-to-end compile CLI execution finishes in under 4.5 seconds (verified with benchmark timer).
- [ ] Chromium PDF rendering runs in parallel with zero deadlocks or residual processes.

### Visual & Typographic Quality
- [ ] PDF pages pass visual raster audit: 0% text truncation, perfectly aligned decimal columns, authentic seal aspect ratio (620:390), and balanced white space.
- [ ] Web dashboard includes instant search, status pills, dark/light executive theme, and 1-click clipboard synchronization.

### Accounting & Mathematical Accuracy
- [ ] USD & TL sums match Paraşüt and Garanti BBVA records to the exact cent (Net Bakiye: +$784,60 USD / +38.461,09 TL Brosan avansı).


## 2026-10-09T17:12:26Z

Implement Phase 6 Ultimate Sovereign Citadel hardening for Brosan Tekstil ERP at https://brosangroup.com/muhasebe to achieve absolute zero-trust hack-proof defense-in-depth, incorporating strict egress firewalling (anti-exfiltration/SSRF), ephemeral single-use sliding token rotation (anti-token theft), client-side cryptographic Proof-of-Work botnet shielding, and process runtime memory armor.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Deep Egress Firewall & SSRF / Data Exfiltration Armor
Implement an outbound connection control engine in `server/egressFirewall.js`. Intercept all outgoing HTTP/HTTPS/socket attempts from the Node.js application process. Block access to private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), loopbacks (`127.0.0.0/8`, `::1`), and non-whitelisted external destinations. Any prohibited outbound call must be aborted immediately with `EGRESS_PROHIBITED`, logged in `security-audit.log`, and dispatched as a high-severity alert via `threatAlerter`.

### R2. Ephemeral Single-Use Sliding Token Rotation & Replay Trap
Implement dynamic cryptographic token rotation in `server/ephemeralTokens.js`. For every state-mutating request (POST/PUT/DELETE), invalidate the incoming JWT upon verification and return a cryptographically linked, single-use successor token in the `X-Brosan-Next-Token` header. If an already-consumed or stale token is presented again (indicating token theft or replay), immediately revoke the entire user token family, activate emergency IP quarantine in `quarantineEngine`, and record `TOKEN_REPLAY_BREACH_DETECTED` in SIEM logs.

### R3. Cryptographic Proof-of-Work (PoW) Anti-Botnet Shield
Implement a dynamic Proof-of-Work challenge mechanism in `server/proofOfWork.js`. When burst traffic or brute-force activity is detected on `/api/auth/login`, issue a cryptographically signed SHA-256 collision challenge (dynamic difficulty `leadingZeros`, sliding 60s TTL). Require incoming authentication payloads to provide a valid nonce solution. Verified solutions consume the challenge; invalid or missing solutions are rejected with HTTP 403 `POW_CHALLENGE_FAILED`, burning attacker compute and rendering automated brute-force attacks economically and computationally impossible.

### R4. Process Runtime Armor & Prototype Freezing
Implement runtime defense hardening in `server/processArmor.js`. Recursively freeze `Object.prototype`, `Array.prototype`, and `Function.prototype` to eliminate prototype pollution at the VM level. Disable dynamic code evaluation (`eval`, `Function` constructor), protect environment secrets (`process.env`) against in-memory modification, and continuously monitor process heap memory to prevent memory exhaustion attacks.

### R5. Comprehensive Adversarial Red-Team Penetration Suite & Production Deployment
Develop a comprehensive red-team penetration test harness in `tests/test-phase6-citadel.js` verifying egress blocking of private/cloud metadata ranges, token rotation replay interception, Proof-of-Work solver verification, and prototype pollution immunity with 100% pass threshold. Deploy to Coolify production on VPS 173.249.23.10 and verify zero regression on `https://brosangroup.com/callcenter/landing`.

## Acceptance Criteria

### Egress Firewall & SSRF
- [ ] Outbound requests to `169.254.169.254`, `127.0.0.1`, and private IP ranges are aborted with `EGRESS_PROHIBITED`.
- [ ] Attempted exfiltration attempts trigger high-severity SIEM audit logs and threat alerts.
- [ ] Whitelisted external integrations (e.g. TCMB exchange rates, external webhooks) pass cleanly without disruption.

### Sliding Token Rotation
- [ ] Mutating API operations issue a fresh `X-Brosan-Next-Token` header.
- [ ] Replaying a retired token revokes all user sessions and quarantines the offending IP.
- [ ] Legitimate sequential client requests maintain seamless authenticated continuity.

### Proof-of-Work Bot Shield
- [ ] `/api/auth/login` challenges automated burst attempts with cryptographically verifiable PoW puzzles.
- [ ] Solved nonces pass cleanly; invalid, expired, or replayed solutions return HTTP 403 `POW_CHALLENGE_FAILED`.

### Process Runtime Armor
- [ ] Attempts to modify `Object.prototype` throw or fail silently without polluting prototypes.
- [ ] Attempts to invoke dynamic evaluation (`eval`) are intercepted and blocked.

### Deployment & Stability
- [ ] All unit, red-team penetration, and E2E security test suites pass with 100% success rate across all 15 master suites.
- [ ] Production deployment on Coolify runs healthy under non-root user `node` (UID 1000).
- [ ] `https://brosangroup.com/muhasebe/api/health` and `https://brosangroup.com/callcenter/landing` remain fully operational (HTTP 200 OK).

## 2026-10-09T22:58:28Z

Brosan Tekstil ERP muhasebe sistemini (https://brosangroup.com/muhasebe) olası tüm APT (Gelişmiş Kalıcı Tehdit) ve sıfır gün (0-day) açıklarına karşı mutlak koruma altına alan Phase 8: Sovereign Quantum Vault & Zero-Knowledge Autonomous Immunity savunma mimarisinin uçtan uca devreye alınması ve Coolify prodüksiyon ortamında sıfır regresyonla canlıya alınması.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Supply Chain & Process Execution Lockdown (`server/processSandboxing.js`)
Uygulama çalışma zamanında (runtime) izinsiz `child_process.exec`, `child_process.spawn`, `fork` ve kabuk komut yürütme (RCE) girişimlerini tespit edip engelleyen, muhasebe API rotalarında alt süreç başlatmayı tamamen yasaklayan ve ihlal durumunda çağrıyı donduran süreç kum havuzu (process sandbox) motoru.

### R2. Hostile Intrusion Deception Mesh & Dynamic Canary Lures (`server/honeyFiles.js`)
Saldırgan tarama botlarını ve içeriden yetkisiz keşif girişimlerini derhal yakalamak üzere dosya sistemi seviyesinde yem dosyalar (`/.git/config`, `/.aws/credentials`, `id_rsa`, `dump.sql`, `backup.tar.gz`). Bu tuzak dosyalara erişim anında saldırgan IP'si derhal 24 saat karantinaya (`quarantineEngine`) alınır, oturumu feshedilir ve SIEM uyarısı tetiklenir.

### R3. Ephemeral Zero-Knowledge Memory Scrubbing & Key Sanitization (`server/cryptoVault.js` & `server/auth.js`)
Bellekte işlenen hassas verilerin (çözülmüş veritabanı alanları, geçici JWT imzalama anahtarları, parola karmaları ve dekont verileri) kullanım döngüsü tamamlanır tamamlanmaz `Buffer.fill(0)` ile RAM'de kalıcı olarak sıfırlanması; böylece olası bellek dökümü (core dump / heap inspection / cold boot) saldırılarında veri sızıntısının %100 önlenmesi.

### R4. Phase 8 Master Penetration Test Suite (`tests/test-phase8-citadel.js`, `tests/run-all-tests.js`)
Tüm Phase 8 savunma vektörlerini (süreç kum havuzu RCE engeli, dosya yemi tuzakları, bellek sıfırlama, sıfır hatalı pozitif) %100 başarı barajıyla test eden özel red-team paketi. Suite 17 olarak `tests/run-all-tests.js` ana test koşucusuna entegre edilerek tüm 17 test paketinin %100 başarıyla geçmesi.

### R5. Coolify Prodüksiyon Dağıtımı & Canlı Doğrulama
VPS 173.249.23.10 üzerinde non-root kullanıcı `node` (UID 1000) ile çalışan güvenli konteyner dağıtımı, `https://brosangroup.com/muhasebe/api/health` ve kardeş servis `https://brosangroup.com/callcenter/landing` üzerinde sıfır regresyonlu canlı prob doğrulaması.

## Acceptance Criteria

### Process Sandboxing
- [ ] Yetkisiz `child_process` çalıştırma veya kabuk komutu enjeksiyonları anında engellenir ve `SECURITY_PROCESS_BLOCKED` döner.
- [ ] Standart sistem komutları veya sunucu başlatma scriptleri meşru başlatma anında güvenle çalışır (0 false positive).

### Honeyfile Deception Mesh
- [ ] Hassas dosya yollarına (`/.git/config`, `/.aws/credentials`, `dump.sql`) yapılan GET/POST talepleri anında `403 CANARY_TRIGGERED` ile kesilir.
- [ ] Tuzak dosyalara dokunan saldırgan IP'si anında dinamik karantinaya alınır ve SIEM uyarısı üretilir.

### Zero-Knowledge Memory Scrubbing
- [ ] Kriptografik işlemlerden sonra çözülen tampon bellekler `Buffer.fill(0)` ile silinir.
- [ ] Çöp toplayıcı (GC) öncesinde heap üzerindeki hassas veriler temizlenir.

### Test & Prodüksiyon
- [ ] `tests/test-phase8-citadel.js` test paketi 15+ iddiayı %100 başarıyla geçer.
- [ ] `tests/run-all-tests.js` içerisindeki tüm 17 test paketi (Phase 1-8) eksiksiz %100 geçer.
- [ ] Coolify VPS 173.249.23.10 üzerinde UID 1000 (`node`) ile container ayağa kalkar, `https://brosangroup.com/muhasebe/api/health` ve kardeş servis `https://brosangroup.com/callcenter/landing` 200 OK döner.

## 2026-10-09T23:39:22Z

Brosan Tekstil ERP muhasebe sistemini (https://brosangroup.com/muhasebe) olası tüm APT, otomatik tarama (automated reconnaissance), bellek manipülasyonu ve sıfır gün açıklarına karşı mutlak koruma altına alan Phase 9: Sovereign Zenith Citadel & Autonomous Cyber Immunity Engine savunma mimarisinin devreye alınması ve Coolify prodüksiyon ortamında sıfır regresyonla canlıya alınması.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Polymorphic Decoy Routes & Anti-Reconnaissance Tarpit (`server/polymorphicTraps.js`)
Otomatik zafiyet tarama araçlarını (Nuclei, Gobuster, Nikto, WPScan, Burp Suite vb.) ve botları tespit eden dinamik tuzak rotalar (`/wp-login.php`, `/.well-known/security.txt`, `/actuator/health`, `/api/v1/swagger.json`, `/solr/admin`, `/phpmyadmin`, `/api/v2/debug`). Bu sahte tuzak rotalar saldırgana rastgele HTTP tarpit gecikmesi (1.5s - 3.5s) yaşatır, anında saldırgan IP'sini 48 saat karantinaya (`quarantineEngine`) alır, oturumunu düşürür ve yüksek öncelikli SIEM uyarısı tetikler.

### R2. Cryptographic Merkle State Snapshot & Tamper-Proof Audit Vault (`server/merkleVault.js`)
Muhasebe ve mali kayıtların (hesap bakiyeleri, fatura hareketleri, dekont kayıtları) bütünlüğünü kriptografik SHA-256 Merkle Ağacı ve HMAC defter mühürleme ile garanti altına alan mekanizma. Her kritik mutasyonda Merkle Kökü hesaplanır, diskteki değiştirilemez (append-only) adli denetim günlüğüne kaydedilir. Bellekte veya veritabanında tek bir baytlık oynama tespit edildiğinde sistem derhal acil durum kilitlenmesine (`lockdownManager`) geçer.

### R3. Autonomous Adversarial Chaos & Fuzzing Immune Sentinel (`server/fuzzingSentinel.js`)
Sistem dahili API uç noktalarını bellek içinde mutasyona uğramış payload'larla (Unicode homograph, null byte injection, prototype pollution, oversized buffer bombs, polyglot SQL/XSS) düzenli olarak test eden ve çalışma zamanında kırılganlık tespiti yapıp anında kalkan üreten otonom bağışıklık motoru.

### R4. Phase 9 Master Penetration Test Suite (`tests/test-phase9-citadel.js`, `tests/run-all-tests.js`)
Tüm Phase 9 savunma vektörlerini (polimorfik tuzaklar, tarpit gecikmesi, Merkle ağacı bütünlük denetimi, fuzzing bağışıklığı) %100 başarı barajıyla test eden özel red-team paketi. Suite 18 olarak `tests/run-all-tests.js` ana test koşucusuna entegre edilerek tüm 18 test paketinin %100 başarıyla geçmesi.

### R5. Coolify Prodüksiyon Dağıtımı & Canlı Doğrulama
VPS 173.249.23.10 üzerinde non-root kullanıcı `node` (UID 1000) ile çalışan güvenli konteyner dağıtımı, `https://brosangroup.com/muhasebe/api/health`, tarpit tuzağı ve kardeş servis `https://brosangroup.com/callcenter/landing` üzerinde sıfır regresyonlu canlı prob doğrulaması.

## Acceptance Criteria

### Polymorphic Traps & Tarpit
- [ ] Bilinen tarama rotalarına (`/wp-login.php`, `/phpmyadmin`, `/actuator/health`) gelen istekler HTTP 403 `DECOY_TRAP_TRIGGERED` ile yakalanır.
- [ ] İhlal yapan IP anında karantinaya alınır ve SIEM uyarısı üretilir.
- [ ] Meşru ERP API rotaları (örneğin `/muhasebe/api/*`) gecikmesiz çalışır (0 false positive).

### Merkle State Vault
- [ ] Hesap hareketleri ve bakiye mutasyonları SHA-256 Merkle Ağacı ile kriptografik olarak mühürlenir.
- [ ] Defterde yetkisiz bir kayıt veya bakiye tutarsızlığı simüle edildiğinde `MERKLE_ROOT_MISMATCH` tespit edilerek acil kilitlenme tetiklenir.

### Fuzzing Immune Sentinel
- [ ] Null-byte, Unicode homograph ve prototype pollution fuzzer yükleri WAF ve validator katmanları tarafından %100 filtrelenir.
- [ ] Fuzzing motoru meşru üretim verilerine zarar vermeden sanal koruma sağlar.

### Test & Prodüksiyon
- [ ] `tests/test-phase9-citadel.js` test paketi 15+ iddiayı %100 başarıyla geçer.
- [ ] `tests/run-all-tests.js` içerisindeki tüm 18 test paketini (Phase 1-9) eksiksiz %100 geçer.
- [ ] Coolify VPS 173.249.23.10 üzerinde UID 1000 (`node`) ile container ayağa kalkar, `https://brosangroup.com/muhasebe/api/health` ve kardeş servis `https://brosangroup.com/callcenter/landing` 200 OK döner.


## 2026-10-10T01:04:31Z

Brosan Tekstil ERP muhasebe sistemini (https://brosangroup.com/muhasebe) kuantum bilgisayar tehditlerine (Shor algoritması), bellek dökümü ve yığın taşması (heap buffer overflow/inspection) girişimlerine ve gelişmiş devlet destekli APT saldırılarına karşı mutlak koruma altına alan Phase 10: Sovereign Omega Citadel & Post-Quantum Anti-Tamper Immutable Telemetry savunma mimarisinin devreye alınması ve Coolify prodüksiyon ortamında sıfır regresyonla canlıya alınması.

Working directory: c:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\YÜKLEME EVRAKLARI ANTIGRAVITY
Integrity mode: development

## Requirements

### R1. Post-Quantum Resistant Hybrid Cryptographic Signer (`server/postQuantumSigner.js`)
NIST FIPS 204 ML-DSA/Dilithium uyumlu kafes tabanlı (lattice-based) kuantum sonrası imzalama mantığı ile klasik Ed25519 anahtarını birleştiren çift hibrit kriptografik zarf (hybrid envelope). Resmi mali beyannameler (ETGB, İBKB, TTK 94 Cari Mutabakat) ve kritik defter mutasyonları için kuantum dirençli ileriye dönük gizlilik (forward secrecy). Doğrulama fonksiyonu: `verifyHybridSignature(payload, hybridEnvelope)`.

### R2. Kernel-Style Heap Canary & Memory Corruption Tripwire (`server/heapCanary.js`)
Hassas V8 tampon belleklerinde (master anahtarlar, JWT sırları, çözülen dekont tamponları) bitişik olarak tahsis edilen 64 baytlık yüksek entropili, HMAC kimlik doğrulamalı "canary guard words" (ölümcül tuzak etiketleri). Her kritik kriptografik işlem öncesinde ve periyodik arka plan taramasında (her 5 sn) bu koruma etiketleri denetlenir. Yığın taşması, bellek kazıma veya bayt manipülasyonu tespit edildiği mikrosaniyede bellek anında sıfırlanır (`Buffer.fill(0)`), sistem acil panik kilitlenmesine (`lockdownManager`) geçer ve SIEM uyarısı tetiklenir.

### R3. Autonomous Out-of-Band Attestation & Immutable Telemetry (`server/peerAttestation.js`)
Uygulama çalışma zamanının (kod hash'leri, bellek sentinelleri, Merkle durum kökü, aktif güvenlik politikaları) değiştirilemez kriptografik durum özetini (attestation proof) üreten otonom telemetri motoru. API yanıtlarına `X-Brosan-Attestation-Proof` başlığını enjekte eder ve `/api/audit/attestation` uç noktasında üçüncü taraf denetçilere doğrulanabilir kriptografik kanıt sunar.

### R4. Phase 10 Master Penetration Test Suite (`tests/test-phase10-citadel.js`, `tests/run-all-tests.js`)
Tüm Phase 10 savunma vektörlerini (Post-Quantum hibrit imza, heap canary yığın bütünlüğü ve sıfırlama, attestation telemetrisi) %100 başarı barajıyla test eden özel red-team paketi. Suite 19 olarak `tests/run-all-tests.js` ana test koşucusuna entegre edilerek tüm 19 test paketinin %100 başarıyla geçmesi.

### R5. Coolify Prodüksiyon Dağıtımı & Canlı Doğrulama
VPS 173.249.23.10 üzerinde non-root kullanıcı `node` (UID 1000) ile çalışan güvenli konteyner dağıtımı, `https://brosangroup.com/muhasebe/api/health`, `/api/audit/attestation`, tarpit tuzağı ve kardeş servis `https://brosangroup.com/callcenter/landing` üzerinde sıfır regresyonlu canlı prob doğrulaması.

## Acceptance Criteria

### Post-Quantum Hybrid Signer
- [ ] Klasik Ed25519 ve kuantum sonrası kafes karmalarını birleştiren hibrit imzalama ve doğrulama çalışır.
- [ ] Geçersiz veya tahrif edilmiş imzalarda `INVALID_HYBRID_SIGNATURE` ile işlem reddedilir.

### Heap Canary Tripwire
- [ ] Bellek koruma etiketleri (canary guard words) hasar aldığında (simüle edilmiş taşma) sistem bunu 0ms gecikmeyle tespit eder.
- [ ] Hasar tespitinde bellek sıfırlanır ve `lockdownManager.activateLockdown` tetiklenir.
- [ ] Normal işlemler sırasında 0 false positive ile çalışır.

### Out-of-Band Attestation
- [ ] API yanıtlarında geçerli `X-Brosan-Attestation-Proof` başlığı döner.
- [ ] `/api/audit/attestation` uç noktasında runtime bütünlük kanıtını doğrular.

### Test & Prodüksiyon
- [ ] `tests/test-phase10-citadel.js` test paketi 15+ iddiayı %100 başarıyla geçer.
- [ ] `tests/run-all-tests.js` içerisindeki tüm 19 test paketi (Phase 1-10) eksiksiz %100 geçer.
- [ ] Coolify VPS 173.249.23.10 üzerinde UID 1000 (`node`) ile container ayağa kalkar, `https://brosangroup.com/muhasebe/api/health` ve kardeş servis `https://brosangroup.com/callcenter/landing` 200 OK döner.
