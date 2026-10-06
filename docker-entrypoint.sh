#!/bin/sh
set -e

echo "🚀 [BROSAN ERP] Konteyner başlatılıyor..."

# PostgreSQL veritabanının hazır olmasını bekle
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ [BROSAN ERP] Veritabanı bağlantısı bekleniyor..."
  until npx prisma db push --skip-generate --accept-data-loss; do
    echo "🔄 [BROSAN ERP] PostgreSQL henüz hazır değil, 2 saniye sonra tekrar deneniyor..."
    sleep 2
  done
  echo "✅ [BROSAN ERP] Prisma şeması ve tablolar başarıyla güncellendi!"

  # Tohumlama (Seed)
  if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 [BROSAN ERP] Varsayılan veriler yükleniyor (Seed)..."
    node prisma/seed.js || true
  fi
fi

echo "🏭 [BROSAN ERP] Uygulama sunucusu başlatılıyor..."
exec "$@"
