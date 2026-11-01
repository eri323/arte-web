import { describe, expect, it } from 'vitest';
import {
  etiquetaMedida,
  formatearFecha,
  formatearNumeroPedido,
  formatearPesos,
  parsearNumeroPedido,
} from './formato';

describe('formatearPesos', () => {
  it.each([
    [0, '$ 0'],
    [15000, '$ 15.000'],
    [130000, '$ 130.000'],
    [1250000, '$ 1.250.000'],
  ])('%i → %s', (valor, esperado) => {
    expect(formatearPesos(valor).replace(/\s/g, ' ')).toBe(esperado);
  });

  it('rechaza montos con decimales', () => {
    expect(() => formatearPesos(10.5)).toThrow();
  });
});

describe('formatearFecha', () => {
  it('usa formato colombiano con mes en letras', () => {
    expect(formatearFecha('2026-11-03T15:00:00.000Z')).toBe('3 de noviembre de 2026');
  });
});

describe('número de pedido', () => {
  it('une prefijo y consecutivo', () => {
    expect(formatearNumeroPedido('AE', 1042)).toBe('AE-1042');
  });

  it.each([
    ['AE-1042', { prefijo: 'AE', consecutivo: 1042 }],
    [' ae-1042 ', { prefijo: 'AE', consecutivo: 1042 }],
    ['AE1042', null],
    ['AE-', null],
    ['', null],
  ])('parsea %j', (texto, esperado) => {
    expect(parsearNumeroPedido(texto)).toEqual(esperado);
  });
});

describe('etiquetaMedida', () => {
  const medida = { id: '30x40', anchoCm: 30, altoCm: 40, precio: 60000 };
  it('vertical deja ancho×alto', () => expect(etiquetaMedida(medida, 'vertical')).toBe('30×40'));
  it('horizontal invierte', () => expect(etiquetaMedida(medida, 'horizontal')).toBe('40×30'));
  it('sin orientación usa la vertical', () => expect(etiquetaMedida(medida)).toBe('30×40'));
});
