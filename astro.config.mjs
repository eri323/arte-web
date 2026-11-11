// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// Dominio del sitio publicado. De aquí salen las URL absolutas de og:image: si no coincide con el
// sitio real, la vista previa del link (WhatsApp, Instagram) no carga o muestra otra marca.
// Netlify y Cloudflare Pages dicen el dominio durante el build (URL y CF_PAGES_URL), así que la
// vista previa sale bien sin tocar este archivo, sea cual sea el nombre del sitio.
// SUPUESTO: si se construye en otro lado, se usa racetrackposters.netlify.app; cámbialo por el
// dominio real si es otro.
// loadEnv con prefijo vacío trae también las variables del sistema, sin depender de los tipos de Node.
const entorno = loadEnv('production', '.', '');
const sitio = entorno.URL || entorno.CF_PAGES_URL || 'https://racetrackposters.netlify.app';

export default defineConfig({
  site: sitio,
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
