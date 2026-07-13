# Sharp/libvips is unreliable on Alpine (musl) for some JPEG/PNG sources; use glibc for the build.
FROM node:24-bookworm-slim AS builder
WORKDIR /site
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY astro.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src
# Astro 7's Rust compiler uses Rayon; cap threads so Docker builds don't hit nproc limits.
ENV RAYON_NUM_THREADS=4
RUN npm run build

FROM nginx:alpine
COPY --from=builder /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
