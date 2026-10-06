# ==============================================================================
# BROSAN TEKSTİL ERP — PRODUCTION DOCKERFILE
# Multi-Stage, Lightweight Alpine Linux, Fail-Closed Security
# ==============================================================================

# STAGE 1: Bağımlılıkların derlenmesi ve Prisma İstemcisi
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL ve build araçları (Prisma binary için zorunlu)
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --include=dev
RUN npx prisma generate

# STAGE 2: Üretim Çalışma Ortamı (Production Runner)
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl curl libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Builder aşamasından bağımlılıkları kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Uygulama kaynak dosyaları
COPY server ./server
COPY app ./app
COPY data ./data
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Çalıştırma izinleri
RUN chmod +x ./docker-entrypoint.sh

# Güvenlik: Standart port ve sağlık kontrolü
EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server/index.js"]
