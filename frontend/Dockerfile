FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG REACT_APP_API_BASE_URL=https://devapi.fomo.cx/api

ENV CI=false
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM caddy:2-alpine AS runner

COPY --from=builder /app/build /usr/share/caddy

RUN printf '%s\n' \
  ':80 {' \
  '  root * /usr/share/caddy' \
  '  encode zstd gzip' \
  '  try_files {path} /index.html' \
  '  file_server' \
  '}' > /etc/caddy/Caddyfile

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
