# syntax=docker/dockerfile:1.4
FROM node:24-alpine AS builder
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Host-persisted Astro image cache (see docker-compose additional_contexts).
# Survives `docker compose build --no-cache`; only new/changed assets are processed.
RUN --mount=type=bind,from=astro-cache,target=/site/.astro-cache,rw \
    npm run build

FROM nginx:alpine
COPY --from=builder /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
