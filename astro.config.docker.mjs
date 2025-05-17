// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import staticAdapter from '@astrojs/static';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), staticAdapter()],
  experimental: {
  },
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static'
});
