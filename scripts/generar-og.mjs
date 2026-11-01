// Genera las imágenes Open Graph (1200×630) de public/og/ a partir de un SVG.
// Se versionan en el repo; vuelve a correrlo si cambias la marca: `npm run og`.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');

// Copiado de src/config/negocio.ts para no compilar TypeScript aquí.
const marca = {
  nombre: 'Áurea Estudio',
  acento: '#ca3517',
  fondo: '#f4efe7',
  texto: '#231814',
  cinta: '#e7d2a0',
};

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

function svg({ titulo, sub }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${marca.acento}"/>
  <g transform="rotate(2 940 295)">
    <rect x="800" y="100" width="280" height="390" fill="#0f3b4c" stroke="${marca.texto}" stroke-width="10"/>
    ${[180, 240, 300, 360, 420]
      .map(
        (y, i) =>
          `<path d="M805 ${y} Q 872 ${y - 36} 940 ${y} T 1075 ${y}" fill="none" stroke="${['#7fc8c2', '#5aa9b0', '#3d8a9b', '#2a6d82', '#1d566b'][i]}" stroke-width="18"/>`,
      )
      .join('')}
  </g>
  <rect x="895" y="82" width="90" height="30" fill="${marca.cinta}" transform="rotate(-3 940 97)"/>
  <text x="90" y="140" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="34" fill="${marca.fondo}">${escapar(marca.nombre)}</text>
  ${lineas(titulo)
    .map(
      (l, i) =>
        `<text x="90" y="${260 + i * 72}" font-family="Arial Black, Arial, sans-serif" font-size="64" font-weight="900" fill="${marca.fondo}">${escapar(l)}</text>`,
    )
    .join('')}
  <text x="90" y="${260 + lineas(titulo).length * 72 + 10}" font-family="Arial, sans-serif" font-size="30" fill="${marca.fondo}">${escapar(sub)}</text>
  <text x="90" y="560" font-family="Arial, sans-serif" font-size="22" fill="${marca.fondo}">Demo · marca ficticia</text>
</svg>`;
}

mkdirSync(carpeta, { recursive: true });
for (const pagina of paginas) {
  await sharp(Buffer.from(svg(pagina)))
    .png({ compressionLevel: 9 })
    .toFile(join(carpeta, pagina.archivo));
  console.log(`og/${pagina.archivo}`);
}
