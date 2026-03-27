# Shared base stage for Debian mirror configuration and Prisma runtime deps
FROM docker.cnb.cool/jaguarliu.cool/wenyuan-ai/docker-sync/node:20-slim_amd64 AS base

ARG DEBIAN_MIRROR=mirrors.tuna.tsinghua.edu.cn

RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i "s|http://deb.debian.org/debian|https://${DEBIAN_MIRROR}/debian|g; s|http://deb.debian.org/debian-security|https://${DEBIAN_MIRROR}/debian-security|g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i "s|http://deb.debian.org/debian|https://${DEBIAN_MIRROR}/debian|g; s|http://deb.debian.org/debian-security|https://${DEBIAN_MIRROR}/debian-security|g" /etc/apt/sources.list; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates; \
    rm -rf /var/lib/apt/lists/*

# Build stage
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Accept build arguments
ARG COS_SECRET_ID
ARG COS_SECRET_KEY
ARG COS_BUCKET
ARG COS_REGION
ARG NEXTAUTH_SECRET

# Set as environment variables for build
ENV COS_SECRET_ID=$COS_SECRET_ID
ENV COS_SECRET_KEY=$COS_SECRET_KEY
ENV COS_BUCKET=$COS_BUCKET
ENV COS_REGION=$COS_REGION
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Install tsx for seed script
RUN npm install -D tsx

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/supabase_backup ./supabase_backup
COPY entrypoint.sh ./entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
