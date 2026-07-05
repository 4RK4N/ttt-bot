FROM node:24-alpine AS deps-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps-dev AS build-all
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY bot ./bot
COPY web-admin ./web-admin
COPY scripts ./scripts
RUN npm run build

FROM node:24-alpine AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM deps-prod AS deps-prod-bot
RUN rm -rf node_modules/hono node_modules/@hono

FROM deps-prod AS deps-prod-web
RUN rm -rf node_modules/@napi-rs

FROM node:24-alpine AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-bot /app/node_modules ./node_modules
COPY --from=deps-prod-bot /app/package.json ./package.json
COPY --from=build-all /app/dist ./dist
USER node
CMD ["node", "dist/bot/src/index.js"]

FROM node:24-alpine AS ttt-web-editor
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-web /app/node_modules ./node_modules
COPY --from=deps-prod-web /app/package.json ./package.json
COPY --from=build-all /app/dist ./dist
USER node
CMD ["node", "dist/web-admin/src/server.js"]
