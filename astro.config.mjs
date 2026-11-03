// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Dominio de la demo publicada. De aquí salen las URL absolutas de og:image; para un taller real va su dominio.
  site: 'https://arte-web-tau.vercel.app',
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
