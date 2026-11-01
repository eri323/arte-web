import { negocio, type ColoresMarca } from '../config/negocio';

// Paleta de la marca a partir de tres colores (firma, pared y texto). El resto se deriva y se
// ajusta solo para que todo el texto pase contraste AA, así el taller no puede romper la lectura
// eligiendo colores en el panel.

export interface BasePaleta {
  acento: string;
  fondo: string;
  texto: string;
}

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

export function esColorHex(valor: string): boolean {
  return HEX.test(valor);
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminancia(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG entre dos colores (de 1 a 21). Ignora la transparencia. */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Mezcla en sRGB: t = 0 es `a`, t = 1 es `b`. */
export function mezclar(a: string, b: string, t: number): string {
  const [ca, cb] = [rgb(a), rgb(b)];
  return `#${ca
    .map((c, i) => Math.round(c + (cb[i]! - c) * t))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Acerca `color` hacia `hacia` lo mínimo necesario para que contraste ≥ `minimo` con todos los `contra`. */
function ajustar(color: string, hacia: string, contra: string[], minimo: number): string {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const candidato = mezclar(color, hacia, Math.min(t, 1));
    if (contra.every((c) => contraste(candidato, c) >= minimo)) return candidato;
  }
  return hacia;
}

export function baseDe(colores: ColoresMarca): BasePaleta {
  return { acento: colores.acento, fondo: colores.fondo, texto: colores.texto };
}

export function derivarPaleta(base: BasePaleta): ColoresMarca {
  const { acento, fondo, texto } = base;
  const superficie = mezclar(fondo, texto, 0.06);
  // El texto suave arranca a un 35% del camino hacia el fondo y se oscurece si hace falta.
  const textoSuave = ajustar(mezclar(texto, fondo, 0.35), texto, [fondo, superficie], 4.5);
  const acentoFuerte = ajustar(acento, texto, [fondo, superficie], 4.5);
  const sobreAcento = contraste(fondo, acento) >= contraste(texto, acento) ? fondo : texto;
  // El hover se aleja del texto del botón (hacia el otro extremo de la paleta) un 18%.
  const opuesto = sobreAcento === fondo ? texto : fondo;
  const acentoHover = ajustar(mezclar(acento, opuesto, 0.18), opuesto, [sobreAcento], 4.5);
  return {
    fondo,
    superficie,
    texto,
    textoSuave,
    acento,
    acentoFuerte,
    sobreAcento,
    acentoHover,
    linea: `${texto}26`,
    lineaFuerte: `${texto}40`,
    cinta: negocio.marca.colores.cinta,
  };
}

export interface Revision {
  id: 'texto' | 'botones' | 'acento';
  etiqueta: string;
  ratio: number;
  minimo: number;
  ok: boolean;
}

export function revisarPaleta(c: ColoresMarca): Revision[] {
  const revision = (id: Revision['id'], etiqueta: string, a: string, b: string, minimo: number) => {
    const ratio = contraste(a, b);
    return { id, etiqueta, ratio, minimo, ok: ratio >= minimo };
  };
  return [
    revision('texto', 'Texto sobre la pared', c.texto, c.fondo, 4.5),
    revision('botones', 'Texto de los botones', c.sobreAcento, c.acento, 4.5),
    // SUPUESTO: 3:1 es el mínimo WCAG para elementos que no son texto (el botón contra la pared).
    revision('acento', 'Color de firma contra la pared', c.acento, c.fondo, 3),
  ];
}

export interface PaletaDemo {
  nombre: string;
  base: BasePaleta;
}

// SUPUESTO: paletas de ejemplo para mostrar en la demo cómo cambia la marca; no son de ningún
// negocio real. La primera es la de negocio.ts.
export const PALETAS_DEMO: PaletaDemo[] = [
  { nombre: 'Bermellón', base: baseDe(negocio.marca.colores) },
  { nombre: 'Cobalto', base: { acento: '#2445c2', fondo: '#f2f0ea', texto: '#141a2e' } },
  { nombre: 'Monte', base: { acento: '#2f6b4f', fondo: '#f1efe6', texto: '#1b2420' } },
  { nombre: 'Chicle', base: { acento: '#c2185b', fondo: '#fbf1f3', texto: '#2a1220' } },
  { nombre: 'Noche y mostaza', base: { acento: '#e0a526', fondo: '#1d1a17', texto: '#f4efe7' } },
  { nombre: 'Blanco y negro', base: { acento: '#161616', fondo: '#f5f5f2', texto: '#161616' } },
];
