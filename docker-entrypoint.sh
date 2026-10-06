#!/bin/sh
set +e

echo "🚀 [BROSAN ERP] Konteyner başlatılıyor..."

# PostgreSQL veritabanının hazır olmasını bekle
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ [BROSAN ERP] Veritabanı bağlantısı bekleniyor..."
  for i in $(seq 1 30); do
    if npx prisma db push --skip-generate --accept-data-loss; then
      echo "✅ [BROSAN ERP] Prisma şeması ve tablolar başarıyla güncellendi!"
      break
    fi
    echo "🔄 [BROSAN ERP] PostgreSQL henüz hazır değil (deneme $i/30), 2 saniye sonra tekrar deneniyor..."
    sleep 2
  done

  # Tohumlama (Seed)
  if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 [BROSAN ERP] Varsayılan veriler yükleniyor (Seed)..."
    node prisma/seed.js || true
  fi
fi

set -e
echo "🏭 [BROSAN ERP] Uygulama sunucusu başlatılıyor..."
exec "$@"
