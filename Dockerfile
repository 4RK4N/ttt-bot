FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps AS build-bot
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY bot ./bot
COPY scripts ./scripts
RUN npm run build:bot && npm prune --omit=dev

FROM node:24-alpine AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-bot /app/node_modules ./node_modules
COPY --from=build-bot /app/package.json ./package.json
COPY --from=build-bot /app/dist ./dist
USER node
CMD ["node", "dist/bot/src/index.js"]

FROM deps AS build-web-admin
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY web-admin ./web-admin
COPY scripts/copy-web-plugins.js ./scripts/copy-web-plugins.js
RUN npm run build:web-admin && npm prune --omit=dev

FROM node:24-alpine AS ttt-web-editor
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-web-admin /app/node_modules ./node_modules
COPY --from=build-web-admin /app/package.json ./package.json
COPY --from=build-web-admin /app/dist ./dist
USER node
CMD ["node", "dist/web-admin/src/server.js"]
