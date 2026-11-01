// Genera las imágenes de prueba de tests/fixtures si no existen.
// Son degradados planos para que pesen poco pero tengan las dimensiones exactas.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures');

const fixtures = [
  { nombre: 'retrato-12mp.jpg', ancho: 3024, alto: 4032 },
  { nombre: 'pequena.jpg', ancho: 800, alto: 600 },
];

mkdirSync(carpeta, { recursive: true });

for (const { nombre, ancho, alto } of fixtures) {
  const ruta = join(carpeta, nombre);
  if (existsSync(ruta)) continue;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d4af6a"/><stop offset="1" stop-color="#1a1714"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toFile(ruta);
  console.log(`Creado ${nombre} (${ancho}×${alto})`);
}

// Archivos que el configurador debe rechazar: un HEIC que el navegador no puede abrir y un PDF.
for (const [nombre, contenido] of [
  ['falso.heic', 'no es una imagen'],
  ['documento.pdf', '%PDF-1.4'],
]) {
  const ruta = join(carpeta, nombre);
  if (!existsSync(ruta)) writeFileSync(ruta, contenido);
}
