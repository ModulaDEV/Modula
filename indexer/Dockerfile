# Modula indexer — multi-stage Dockerfile.
#
# IMPORTANT: build context must be the repo root, not indexer/, so
# packages/abi/ is reachable. On Railway, configure the service to
# use this Dockerfile via railway.json (`dockerfilePath` is the path
# from the repo root).
#
#   docker build -f indexer/Dockerfile -t modula-indexer .

# ---------- stage 1: install workspace deps ----------
FROM node:22-alpine AS deps

WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@10 --activate

# Copy only the manifests so this layer cache survives source edits.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/abi/package.json   ./packages/abi/
COPY indexer/package.json        ./indexer/
COPY gateway/package.json        ./gateway/

RUN pnpm install --frozen-lockfile --prefer-offline

# ---------- stage 2: build ----------
FROM deps AS build

COPY packages/abi   ./packages/abi
COPY indexer        ./indexer

RUN pnpm --filter @modula/abi build \
 && pnpm --filter @modula/indexer build \
 # Bundle indexer + its prod deps into /deploy (excludes devDependencies).
 && pnpm --filter @modula/indexer --prod deploy /deploy

# ---------- stage 3: runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=8788 \
    HOST=0.0.0.0

WORKDIR /app

# Run as non-root.
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build --chown=app:app /deploy ./

EXPOSE 8788

# Indexer responds to SIGTERM with a graceful drain (see src/index.ts).
STOPSIGNAL SIGTERM

CMD ["node", "dist/index.js"]
