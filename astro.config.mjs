import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// Hybrid: public pages are prerendered (static) by default; the internal
// editor and its /api routes opt into server rendering via `prerender = false`.
export default defineConfig({
  site: 'https://shurooq.example',
  output: 'hybrid',
  adapter: vercel(),
  compressHTML: true,
});
