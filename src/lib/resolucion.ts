import type { Medida, Negocio, Orientacion } from '../config/negocio';

export type Calidad = 'buena' | 'regular' | 'baja';
export type Umbrales = Negocio['resolucion'];

export interface Dimensiones {
  ancho: number;
  alto: number;
}

/** Área en porcentajes de la imagen original (0–100), como la entrega react-easy-crop. */
export interface AreaPorcentaje {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CM_POR_PULGADA = 2.54;

export function dimensionesMedida(
  medida: Pick<Medida, 'anchoCm' | 'altoCm'>,
  orientacion: Orientacion,
): { anchoCm: number; altoCm: number } {
  return orientacion === 'horizontal'
    ? { anchoCm: medida.altoCm, altoCm: medida.anchoCm }
    : { anchoCm: medida.anchoCm, altoCm: medida.altoCm };
}

export function calcularDpi(
  anchoPx: number,
  altoPx: number,
  anchoCm: number,
  altoCm: number,
): number {
  return Math.min(anchoPx / (anchoCm / CM_POR_PULGADA), altoPx / (altoCm / CM_POR_PULGADA));
}

export function nivelCalidad(dpi: number, umbrales: Umbrales): Calidad {
  if (dpi >= umbrales.buena) return 'buena';
  if (dpi >= umbrales.regular) return 'regular';
  return 'baja';
}

/** Píxeles reales del recorte: porcentaje × dimensiones originales. */
export function pixelesRecorte(
  area: AreaPorcentaje,
  original: Dimensiones,
): { anchoPx: number; altoPx: number } {
  return {
    anchoPx: Math.round((area.width / 100) * original.ancho),
    altoPx: Math.round((area.height / 100) * original.alto),
  };
}

/** El recorte más grande con esa proporción (ancho/alto), centrado. */
export function recorteCompleto(original: Dimensiones, proporcion: number): AreaPorcentaje {
  const proporcionFoto = original.ancho / original.alto;
  if (proporcionFoto > proporcion) {
    const width = (proporcion / proporcionFoto) * 100;
    return { x: (100 - width) / 2, y: 0, width, height: 100 };
  }
  const height = (proporcionFoto / proporcion) * 100;
  return { x: 0, y: (100 - height) / 2, width: 100, height };
}

export function evaluarRecorte(
  recorte: { anchoPx: number; altoPx: number },
  medida: Medida,
  orientacion: Orientacion,
  umbrales: Umbrales,
): { dpi: number; nivel: Calidad } {
  const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
  const dpi = calcularDpi(recorte.anchoPx, recorte.altoPx, anchoCm, altoCm);
  return { dpi, nivel: nivelCalidad(dpi, umbrales) };
}

/** La medida más grande que da calidad buena usando la foto completa. */
export function medidaMasGrandeBuena(
  original: Dimensiones,
  medidas: Medida[],
  orientacion: Orientacion,
  umbrales: Umbrales,
): Medida | null {
  let mejor: Medida | null = null;
  for (const medida of medidas) {
    const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
    const area = recorteCompleto(original, anchoCm / altoCm);
    const { nivel } = evaluarRecorte(pixelesRecorte(area, original), medida, orientacion, umbrales);
    if (
      nivel === 'buena' &&
      (!mejor || medida.anchoCm * medida.altoCm > mejor.anchoCm * mejor.altoCm)
    ) {
      mejor = medida;
    }
  }
  return mejor;
}
