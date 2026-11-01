// Genera las imágenes Open Graph (1200×630) de public/og/ a partir de un SVG.
// Se versionan en el repo; vuelve a correrlo si cambias la marca: `npm run og`.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');

// Copiado de src/config/negocio.ts para no compilar TypeScript aquí.
const marca = { nombre: 'Áurea Estudio', fondo: '#0f0d0b', texto: '#f2ede4', dorado: '#d4af6a' };

const paginas = [
  {
    archivo: 'inicio.png',
    titulo: 'Tus fotos, convertidas en cuadros',
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
function lineas(texto, max = 20) {
  const resultado = [''];
  for (const palabra of texto.split(' ')) {
    const actual = resultado[resultado.length - 1];
    if (actual && (actual + ' ' + palabra).length > max) resultado.push(palabra);
    else resultado[resultado.length - 1] = actual ? `${actual} ${palabra}` : palabra;
  }
  return resultado;
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function svg({ titulo, sub }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${marca.fondo}"/>
  <rect x="790" y="95" width="300" height="400" fill="#1a1714" stroke="${marca.dorado}" stroke-width="3"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f6c177"/><stop offset="1" stop-color="#56324a"/></linearGradient></defs>
  <rect x="815" y="120" width="250" height="350" fill="url(#g)"/>
  <circle cx="940" cy="300" r="60" fill="#fbe7c6"/>
  <rect x="815" y="340" width="250" height="130" fill="#3a2234"/>
  <text x="90" y="150" font-family="Georgia, serif" font-size="40" fill="${marca.dorado}">${escapar(marca.nombre)}</text>
  ${lineas(titulo)
    .map(
      (l, i) =>
        `<text x="90" y="${260 + i * 72}" font-family="Georgia, serif" font-size="62" font-weight="bold" fill="${marca.texto}">${escapar(l)}</text>`,
    )
    .join('')}
  <text x="90" y="${260 + lineas(titulo).length * 72 + 10}" font-family="Arial, sans-serif" font-size="30" fill="#b9b1a3">${escapar(sub)}</text>
  <text x="90" y="560" font-family="Arial, sans-serif" font-size="22" fill="#b9b1a3">Demo · marca ficticia</text>
</svg>`;
}

mkdirSync(carpeta, { recursive: true });
for (const pagina of paginas) {
  await sharp(Buffer.from(svg(pagina)))
    .png({ compressionLevel: 9 })
    .toFile(join(carpeta, pagina.archivo));
  console.log(`og/${pagina.archivo}`);
}
