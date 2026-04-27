# Modula gateway — multi-stage Dockerfile.
#
# Build context must be the repo root, not gateway/, so packages/abi/
# is reachable. Fly's `flyctl deploy` invoked from the repo root will
# do this automatically when fly.toml's `build.dockerfile` is set
# below.
#
#   docker build -f gateway/Dockerfile -t modula-gateway .

# ---------- stage 1: install workspace deps ----------
FROM node:22-alpine AS deps

WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@10 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/abi/package.json   ./packages/abi/
COPY indexer/package.json        ./indexer/
COPY gateway/package.json        ./gateway/

RUN pnpm install --frozen-lockfile --prefer-offline

# ---------- stage 2: build ----------
FROM deps AS build

COPY packages/abi   ./packages/abi
COPY gateway        ./gateway

RUN pnpm --filter @modula/abi build \
 && pnpm --filter @modula/gateway build \
 # `--legacy` is required since pnpm v10 changed the default deploy
 # behavior to require `inject-workspace-packages=true`. Same fix as
 # indexer/Dockerfile — see that file's comment for details.
 && pnpm --filter @modula/gateway --prod --legacy deploy /deploy

# ---------- stage 3: runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=8787 \
    HOST=0.0.0.0

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build --chown=app:app /deploy ./

EXPOSE 8787

# Gateway responds to SIGTERM by closing the HTTP server cleanly.
STOPSIGNAL SIGTERM

CMD ["node", "dist/server.js"]
