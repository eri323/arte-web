// Genera las imágenes Open Graph (1200×630) de public/og/: un SVG con el título y, encima, un
// póster del catálogo dentro de su marco. Se versionan en el repo; vuelve a correrlo si cambias la
// marca o los pósters: `npm run og`.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const carpeta = join(raiz, 'og');

// Copiado de src/config/negocio.ts para no compilar TypeScript aquí.
const marca = {
  nombre: 'RaceTrack Posters',
  instagram: 'racetrackposters',
  acento: '#7a2df0',
  fondo: '#efefec',
  texto: '#0e0e10',
  textoSuave: '#5d5d5d',
};

const paginas = [
  {
    archivo: 'inicio.png',
    titulo: 'Tu carro, convertido en arte',
    sub: 'Pósters de carros y motos, enmarcados',
    poster: 'ferrari-488-pista',
  },
  {
    archivo: 'formatos.png',
    titulo: 'Medidas y precios',
    sub: 'De 13×18 a 70×100 cm, con marco y envío a todo Colombia',
    poster: 'nordschleife',
  },
  {
    archivo: 'crear.png',
    titulo: 'El tuyo, tal cual',
    sub: 'Ilustramos tu carro o tu moto y te llega enmarcado',
    poster: 'mclaren-720s',
  },
  {
    archivo: 'pedido.png',
    titulo: 'Tu pedido',
    sub: 'Total, abono del 50% y pedido por WhatsApp',
    poster: 'ducati-panigale',
  },
  {
    archivo: 'seguimiento.png',
    titulo: '¿En qué va mi póster?',
    sub: 'Estado, pagos y notas del taller',
    poster: 'antonelli-w17',
  },
];

// Parte el título en líneas cortas para que no se monte sobre el póster.
function lineas(texto, max = 15) {
  const resultado = [''];
  for (const palabra of texto.split(' ')) {
    const actual = resultado[resultado.length - 1];
    if (actual && (actual + ' ' + palabra).length > max) resultado.push(palabra);
    else resultado[resultado.length - 1] = actual ? `${actual} ${palabra}` : palabra;
  }
  return resultado;
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const display = 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif';

// El póster: 330×462 de arte con 14 px de marco, a la derecha.
const ARTE = { ancho: 330, alto: 462, marco: 14, x: 790, y: 84 };

function svg({ titulo, sub }) {
  const filas = lineas(titulo);
  const tam = filas.length > 2 ? 84 : 104;
  const y0 = 300 - (filas.length - 1) * tam * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="pared" cx="0.5" cy="0.4" r="0.8">
      <stop offset="0" stop-color="#fbfbf9"/>
      <stop offset="1" stop-color="${marca.fondo}"/>
    </radialGradient>
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#pared)"/>
  <rect x="${ARTE.x - ARTE.marco}" y="${ARTE.y - ARTE.marco}" width="${ARTE.ancho + ARTE.marco * 2}" height="${ARTE.alto + ARTE.marco * 2}" fill="#0b0b0c" filter="url(#sombra)"/>
  <text x="80" y="112" font-family="${display}" font-size="30" letter-spacing="2" fill="${marca.texto}">${escapar(marca.nombre.toUpperCase())}</text>
  <rect x="80" y="130" width="56" height="6" fill="${marca.acento}"/>
  ${filas
    .map(
      (l, i) =>
        `<text x="76" y="${y0 + i * tam}" font-family="${display}" font-size="${tam}" fill="${marca.texto}">${escapar(l.toUpperCase())}</text>`,
    )
    .join('')}
  <text x="80" y="${y0 + (filas.length - 1) * tam + 58}" font-family="Arial, sans-serif" font-size="28" fill="${marca.textoSuave}">${escapar(sub)}</text>
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="22" fill="${marca.textoSuave}">Instagram @${marca.instagram}</text>
</svg>`;
}

mkdirSync(carpeta, { recursive: true });
for (const pagina of paginas) {
  const arte = await sharp(join(raiz, 'catalogo', `${pagina.poster}.webp`))
    .resize(ARTE.ancho, ARTE.alto, { fit: 'cover' })
    .toBuffer();
  await sharp(Buffer.from(svg(pagina)))
    .composite([{ input: arte, left: ARTE.x, top: ARTE.y }])
    .png({ compressionLevel: 9 })
    .toFile(join(carpeta, pagina.archivo));
  console.log(`og/${pagina.archivo}`);
}
