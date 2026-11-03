// Genera las imágenes Open Graph (1200×630) de public/og/ a partir de un SVG.
// Se versionan en el repo; vuelve a correrlo si cambias la marca: `npm run og`.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');

// Copiado de src/config/negocio.ts para no compilar TypeScript aquí.
const marca = {
  nombre: 'Midas Atelier',
  acento: '#e7b94c',
  fondo: '#0b0a09',
  texto: '#f3ece0',
  textoSuave: '#a39a8e',
  led: '#ff2d20',
};

const paginas = [
  {
    archivo: 'inicio.png',
    titulo: 'Cuadros que se roban el cuarto',
    sub: 'MDF y acrílico · Envíos a todo Colombia',
  },
  {
    archivo: 'formatos.png',
    titulo: 'Medidas y precios',
    sub: 'Desde 20×27 hasta 120×160 cm, con promociones',
  },
  {
    archivo: 'crear.png',
    titulo: 'Crea tu cuadro',
    sub: 'Sube tu foto, recórtala y mírala en tu pared',
  },
  {
    archivo: 'pedido.png',
    titulo: 'Tu pedido',
    sub: 'Desglose, abono del 50% y pedido por WhatsApp',
  },
  {
    archivo: 'seguimiento.png',
    titulo: '¿En qué va mi cuadro?',
    sub: 'Estado, pagos y notas del taller',
  },
];

// Parte el título en líneas de hasta 20 caracteres para que no se monte sobre el cuadro.
function lineas(texto, max = 18) {
  const resultado = [''];
  for (const palabra of texto.split(' ')) {
    const actual = resultado[resultado.length - 1];
    if (actual && (actual + ' ' + palabra).length > max) resultado.push(palabra);
    else resultado[resultado.length - 1] = actual ? `${actual} ${palabra}` : palabra;
  }
  return resultado;
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Rayos del sol del logo: 18 cuñas doradas alrededor del centro del cuadro.
const rayos = Array.from({ length: 18 }, (_, k) => {
  const p = (g) => {
    const a = (g * Math.PI) / 180;
    return `${(150 + Math.cos(a) * 400).toFixed(1)},${(185 + Math.sin(a) * 400).toFixed(1)}`;
  };
  return `<polygon points="150,185 ${p(k * 20)} ${p(k * 20 + 10)}" fill="${marca.acento}"/>`;
}).join('');

function svg({ titulo, sub }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="led" cx="0.85" cy="0" r="0.7">
      <stop offset="0" stop-color="${marca.led}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${marca.led}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="c"><rect width="300" height="400"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="${marca.fondo}"/>
  <rect width="1200" height="630" fill="url(#led)"/>
  <g transform="translate(830 110) rotate(3 150 200)">
    <rect x="-14" y="-14" width="328" height="428" fill="${marca.led}" opacity="0.25"/>
    <rect x="8" y="8" width="300" height="400" fill="#000"/>
    <g clip-path="url(#c)">
      <rect width="300" height="400" fill="#0d0b09"/>
      ${rayos}
      <circle cx="150" cy="185" r="62" fill="#0d0b09"/>
      <text x="150" y="212" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="76" fill="${marca.acento}">444</text>
    </g>
  </g>
  <circle cx="112" cy="128" r="20" fill="${marca.acento}"/>
  <text x="146" y="140" font-family="Impact, Arial Black, sans-serif" font-size="34" letter-spacing="3" fill="${marca.texto}">${escapar(marca.nombre.toUpperCase())}</text>
  ${lineas(titulo)
    .map(
      (l, i) =>
        `<text x="90" y="${270 + i * 80}" font-family="Impact, Arial Black, sans-serif" font-size="78" fill="${i === lineas(titulo).length - 1 ? marca.acento : marca.texto}">${escapar(l.toUpperCase())}</text>`,
    )
    .join('')}
  <text x="90" y="${270 + lineas(titulo).length * 80 + 6}" font-family="Arial, sans-serif" font-size="30" fill="${marca.textoSuave}">${escapar(sub)}</text>
  <text x="90" y="560" font-family="Arial, sans-serif" font-size="22" fill="${marca.textoSuave}">Instagram @midasatelier444</text>
</svg>`;
}

mkdirSync(carpeta, { recursive: true });
for (const pagina of paginas) {
  await sharp(Buffer.from(svg(pagina)))
    .png({ compressionLevel: 9 })
    .toFile(join(carpeta, pagina.archivo));
  console.log(`og/${pagina.archivo}`);
}
