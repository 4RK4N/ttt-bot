// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const site = 'https://ttt-ffxiv.eu';

/**
 * The DE homepage lives at the legacy URL /de.html, but a page file at
 * src/pages/de.astro would collide with src/pages/de/index.astro (both claim
 * the "/de" route). So the page is authored at src/pages/de-home/ and this
 * integration moves the built file to de.html; in dev, /de.html is rewritten
 * to /de-home/ so the URL works there too.
 */
const legacyDeHtml = {
  name: 'legacy-de-html',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/de.html') req.url = '/de-home/';
        next();
      });
    },
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      await rename(path.join(root, 'de-home', 'index.html'), path.join(root, 'de.html'));
      await rm(path.join(root, 'de-home'), { recursive: true });
    },
  },
};

export default defineConfig({
  site,
  cacheDir: './.astro-cache',
  build: { format: 'preserve' },
  prefetch: {
    defaultStrategy: 'hover',
    prefetchAll: false,
  },
  image: {
    defaultQuality: 75,
  },
  fonts: [
    {
      name: 'Averia Serif Libre',
      cssVariable: '--font-averia-face',
      provider: fontProviders.google(),
      weights: [400, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      formats: ['woff2'],
    },
    {
      name: 'Gochi Hand',
      cssVariable: '--font-gochi-face',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
    },
    {
      name: 'Caveat',
      cssVariable: '--font-caveat-face',
      provider: fontProviders.google(),
      weights: [700],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
    },
  ],
  integrations: [
    legacyDeHtml,
    sitemap({
      customPages: [`${site}/de.html`],
      filter: (page) => !page.includes('/de-home'),
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
        item.url = url.href;
        item.changefreq = 'weekly';
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
  },
});
