// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // SUPUESTO: dominio provisional; Erick lo cambia al desplegar.
  site: 'https://arte-web.example',
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
