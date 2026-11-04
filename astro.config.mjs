// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Dominio donde está publicada la propuesta de Midas Atelier. De aquí salen las URL absolutas de
  // og:image: si no coincide con el sitio publicado, la vista previa del link muestra otra marca.
  site: 'https://midasatelier.netlify.app',
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
