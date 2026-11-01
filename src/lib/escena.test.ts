import { describe, expect, it } from 'vitest';
import { ESCENA, rectCuadro, rectSofa } from './escena';

describe('escena', () => {
  it('el sofá mide 200 cm y está centrado en el piso', () => {
    expect(rectSofa()).toEqual({ x: 100, y: 185, ancho: 200, alto: 85 });
  });

  it('el cuadro queda centrado y 20 cm sobre el sofá', () => {
    expect(rectCuadro(60, 80)).toEqual({ x: 170, y: 85, ancho: 60, alto: 80 });
  });

  it('el cuadro más grande cabe en la pared', () => {
    const r = rectCuadro(160, 120);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.ancho).toBeLessThanOrEqual(ESCENA.anchoCm);
  });
});
