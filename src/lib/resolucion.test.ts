import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { MEDIDAS } from '../../tests/fixtures/medidas';
import {
  calcularDpi,
  dimensionesMedida,
  evaluarRecorte,
  medidaMasGrandeBuena,
  nivelCalidad,
  pixelesRecorte,
  recorteCompleto,
} from './resolucion';

const medida = (id: string) => {
  const m = MEDIDAS.find((x) => x.id === id);
  if (!m) throw new Error(id);
  return m;
};
const retrato = { ancho: 3024, alto: 4032 };

describe('foto vertical de 12 MP con recorte completo', () => {
  it.each([
    ['20x27', 379, 'buena'],
    ['30x40', 256, 'buena'],
    ['45x60', 171, 'buena'],
    ['60x80', 128, 'regular'],
    ['90x120', 85, 'baja'],
    ['120x160', 64, 'baja'],
  ])('%s ≈ %i dpi (%s)', (id, dpi, nivel) => {
    const m = medida(id);
    const area = recorteCompleto(retrato, m.anchoCm / m.altoCm);
    const r = evaluarRecorte(pixelesRecorte(area, retrato), m, 'vertical', negocio.resolucion);
    expect(Math.round(r.dpi)).toBe(dpi);
    expect(r.nivel).toBe(nivel);
  });

  it('sugiere 45×60 como la medida más grande con calidad buena', () => {
    expect(medidaMasGrandeBuena(retrato, MEDIDAS, 'vertical', negocio.resolucion)?.id).toBe(
      '45x60',
    );
  });
});

describe('orientación', () => {
  it('horizontal invierte ancho y alto', () => {
    expect(dimensionesMedida(medida('30x40'), 'horizontal')).toEqual({ anchoCm: 40, altoCm: 30 });
    expect(dimensionesMedida(medida('30x40'), 'vertical')).toEqual({ anchoCm: 30, altoCm: 40 });
  });

  it('una foto apaisada en horizontal rinde igual que la vertical en vertical', () => {
    const apaisada = { ancho: 4032, alto: 3024 };
    const area = recorteCompleto(apaisada, 60 / 45);
    const r = evaluarRecorte(
      pixelesRecorte(area, apaisada),
      medida('45x60'),
      'horizontal',
      negocio.resolucion,
    );
    expect(Math.round(r.dpi)).toBe(171);
    expect(medidaMasGrandeBuena(apaisada, MEDIDAS, 'horizontal', negocio.resolucion)?.id).toBe(
      '45x60',
    );
  });
});

describe('piezas', () => {
  it('calcularDpi toma el lado más limitante', () => {
    expect(calcularDpi(1000, 2000, 2.54 * 10, 2.54 * 10)).toBeCloseTo(100);
  });

  it.each([
    [150, 'buena'],
    [149.9, 'regular'],
    [100, 'regular'],
    [99.9, 'baja'],
  ])('%s dpi → %s', (dpi, nivel) => {
    expect(nivelCalidad(dpi, negocio.resolucion)).toBe(nivel);
  });

  it('pixelesRecorte multiplica porcentaje por las dimensiones originales', () => {
    expect(
      pixelesRecorte({ x: 10, y: 10, width: 50, height: 25 }, { ancho: 4000, alto: 3000 }),
    ).toEqual({ anchoPx: 2000, altoPx: 750 });
  });

  it('recorteCompleto centra el área con la proporción pedida', () => {
    expect(recorteCompleto({ ancho: 4000, alto: 3000 }, 1)).toEqual({
      x: 12.5,
      y: 0,
      width: 75,
      height: 100,
    });
  });

  it('pequena.jpg (800×600) en 60×80 queda baja', () => {
    const foto = { ancho: 800, alto: 600 };
    const r = evaluarRecorte(
      pixelesRecorte(recorteCompleto(foto, 60 / 80), foto),
      medida('60x80'),
      'vertical',
      negocio.resolucion,
    );
    expect(r.nivel).toBe('baja');
  });

  it('sin ninguna medida buena devuelve null', () => {
    expect(
      medidaMasGrandeBuena({ ancho: 300, alto: 400 }, MEDIDAS, 'vertical', negocio.resolucion),
    ).toBeNull();
  });
});
