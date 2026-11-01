// Geometría de la pared con sofá, en centímetros. El SVG usa viewBox en cm, así que la escala
// sale del ancho del sofá (200 cm) y los cuadros quedan a tamaño real relativo.

export const ESCENA = {
  anchoCm: 400,
  altoCm: 270,
  sofa: { anchoCm: 200, altoCm: 85, asientoCm: 45 },
  /** Espacio entre el respaldo del sofá y el borde inferior del cuadro. */
  separacionCm: 20,
} as const;

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export function rectSofa(): Rect {
  const { anchoCm, altoCm, sofa } = ESCENA;
  return {
    x: (anchoCm - sofa.anchoCm) / 2,
    y: altoCm - sofa.altoCm,
    ancho: sofa.anchoCm,
    alto: sofa.altoCm,
  };
}

/** Cuadro centrado sobre el sofá con su borde inferior a `separacionCm` del respaldo. */
export function rectCuadro(anchoCm: number, altoCm: number): Rect {
  const sofa = rectSofa();
  const abajo = sofa.y - ESCENA.separacionCm;
  return {
    x: ESCENA.anchoCm / 2 - anchoCm / 2,
    y: Math.max(0, abajo - altoCm),
    ancho: anchoCm,
    alto: altoCm,
  };
}
