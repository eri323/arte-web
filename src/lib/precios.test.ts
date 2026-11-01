import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { formatearPesos } from './formato';
import {
  aplicarEdiciones,
  calcularDesglose,
  calcularLineaMedida,
  describirPromocion,
  sugerenciaPromocion,
} from './precios';

const medida = (id: string) => {
  const m = negocio.medidas.find((x) => x.id === id);
  if (!m) throw new Error(id);
  return m;
};

describe('calcularLineaMedida', () => {
  it.each([
    ['20x27', 4, 120000],
    ['20x27', 5, 75000],
    ['20x27', 6, 90000],
    ['30x40', 2, 120000],
    ['30x40', 3, 120000],
    ['45x60', 1, 80000],
    ['45x60', 2, 130000],
    ['45x60', 3, 210000],
    ['45x60', 4, 260000],
    ['60x80', 2, 260000],
    ['120x160', 1, 330000],
  ])('%s × %i = %i', (id, cantidad, total) => {
    expect(calcularLineaMedida(medida(id), cantidad).total).toBe(total);
  });

  it('el descuento es subtotal − total', () => {
    expect(calcularLineaMedida(medida('30x40'), 3)).toEqual({
      medidaId: '30x40',
      cantidad: 3,
      subtotal: 180000,
      descuento: 60000,
      total: 120000,
    });
  });

  it.each([0, -1, 1.5, Number.NaN])('rechaza cantidad %s', (cantidad) => {
    expect(() => calcularLineaMedida(medida('30x40'), cantidad)).toThrow();
  });
});

describe('calcularDesglose', () => {
  it('suma ítems de la misma medida con fotos distintas para la promoción', () => {
    const d = calcularDesglose(
      [
        { medidaId: '20x27', cantidad: 2 },
        { medidaId: '20x27', cantidad: 3 },
      ],
      negocio.medidas,
      50,
    );
    expect(d.lineas).toHaveLength(1);
    expect(d.subtotal).toBe(150000);
    expect(d.descuento).toBe(75000);
    expect(d.total).toBe(75000);
  });

  it('no combina medidas distintas', () => {
    const d = calcularDesglose(
      [
        { medidaId: '30x40', cantidad: 2 },
        { medidaId: '45x60', cantidad: 1 },
      ],
      negocio.medidas,
      50,
    );
    expect(d.lineas.map((l) => [l.medidaId, l.total])).toEqual([
      ['30x40', 120000],
      ['45x60', 80000],
    ]);
    expect(d.descuento).toBe(0);
    expect(d.total).toBe(200000);
  });

  it('calcula abono redondeado hacia arriba y saldo', () => {
    const d = calcularDesglose([{ medidaId: '45x60', cantidad: 3 }], negocio.medidas, 50);
    expect(d.total).toBe(210000);
    expect(d.abono).toBe(105000);
    expect(d.saldo).toBe(105000);
    const impar = calcularDesglose(
      [{ medidaId: '20x27', cantidad: 1 }],
      [{ ...medida('20x27'), precio: 30001 }],
      50,
    );
    expect(impar.abono).toBe(15001);
    expect(impar.saldo).toBe(15000);
  });

  it('carrito vacío da todo en cero', () => {
    expect(calcularDesglose([], negocio.medidas, 50)).toEqual({
      lineas: [],
      subtotal: 0,
      descuento: 0,
      total: 0,
      abono: 0,
      saldo: 0,
    });
  });

  it('rechaza una medida desconocida', () => {
    expect(() =>
      calcularDesglose([{ medidaId: '1x1', cantidad: 1 }], negocio.medidas, 50),
    ).toThrow();
  });

  it('ordena las líneas como la lista de medidas', () => {
    const d = calcularDesglose(
      [
        { medidaId: '60x80', cantidad: 1 },
        { medidaId: '20x27', cantidad: 1 },
      ],
      negocio.medidas,
      50,
    );
    expect(d.lineas.map((l) => l.medidaId)).toEqual(['20x27', '60x80']);
  });
});

describe('sugerenciaPromocion', () => {
  it('2 de 30×40 → agrega 1', () => {
    expect(sugerenciaPromocion(medida('30x40'), 2)).toEqual({
      faltan: 1,
      mensaje: `Agrega 1 más de 30×40 y pagas ${formatearPesos(40000)} c/u`,
    });
  });

  it('1 de 45×60 → paquete', () => {
    expect(sugerenciaPromocion(medida('45x60'), 1)).toEqual({
      faltan: 1,
      mensaje: `Agrega 1 más de 45×60 y llevas 2 por ${formatearPesos(130000)}`,
    });
  });

  it('3 de 45×60 → agrega 1 para otro paquete', () => {
    expect(sugerenciaPromocion(medida('45x60'), 3)?.faltan).toBe(1);
  });

  it('3 de 20×27 → agrega 2', () => {
    expect(sugerenciaPromocion(medida('20x27'), 3)?.faltan).toBe(2);
  });

  it.each([
    ['30x40', 3],
    ['30x40', 7],
    ['45x60', 2],
    ['45x60', 4],
    ['60x80', 1],
    ['30x40', 0],
  ])('%s con %i → sin sugerencia', (id, cantidad) => {
    expect(sugerenciaPromocion(medida(id), cantidad)).toBeNull();
  });
});

describe('describirPromocion', () => {
  it('describe las dos clases de promoción', () => {
    expect(describirPromocion(medida('30x40').promocion)).toBe(
      `3 o más a ${formatearPesos(40000)} c/u`,
    );
    expect(describirPromocion(medida('45x60').promocion)).toBe(`2 por ${formatearPesos(130000)}`);
    expect(describirPromocion(undefined)).toBe('');
  });
});

describe('aplicarEdiciones', () => {
  it('sin ediciones deja las medidas iguales', () => {
    expect(aplicarEdiciones(negocio.medidas, {})).toEqual(negocio.medidas);
  });

  it('cambia precio y promoción, y null quita la promoción', () => {
    const r = aplicarEdiciones(negocio.medidas, {
      '30x40': { precio: 65000 },
      '45x60': { promocion: null },
      '60x80': { promocion: { tipo: 'desde', cantidadMinima: 2, precioUnitario: 110000 } },
    });
    const porId = Object.fromEntries(r.map((m) => [m.id, m]));
    expect(porId['30x40'].precio).toBe(65000);
    expect(porId['30x40'].promocion).toEqual(medida('30x40').promocion);
    expect(porId['45x60'].promocion).toBeUndefined();
    expect(porId['60x80'].promocion?.tipo).toBe('desde');
  });

  it('ignora valores inválidos y medidas que no existen', () => {
    const r = aplicarEdiciones(negocio.medidas, {
      '30x40': { precio: 10.5 },
      '20x27': { precio: -1, promocion: { tipo: 'paquete', cantidad: 0, precioPaquete: 1 } },
      '1x1': { precio: 1 },
    });
    expect(r).toEqual(negocio.medidas);
  });

  it('no muta las medidas originales', () => {
    aplicarEdiciones(negocio.medidas, { '30x40': { precio: 1000 } });
    expect(medida('30x40').precio).toBe(60000);
  });
});

describe('aplicarEdiciones rechaza promociones que encarecen', () => {
  it.each([
    ['desde más caro que el precio', { tipo: 'desde', cantidadMinima: 3, precioUnitario: 90000 }],
    ['desde igual al precio', { tipo: 'desde', cantidadMinima: 3, precioUnitario: 60000 }],
    [
      'paquete más caro que comprar suelto',
      { tipo: 'paquete', cantidad: 2, precioPaquete: 200000 },
    ],
  ] as const)('%s', (_, promocion) => {
    const r = aplicarEdiciones(negocio.medidas, { '30x40': { promocion } });
    expect(r.find((m) => m.id === '30x40')?.promocion).toEqual(medida('30x40').promocion);
  });

  it('valida la promoción contra el precio editado', () => {
    const r = aplicarEdiciones(negocio.medidas, {
      '30x40': {
        precio: 30000,
        promocion: { tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 },
      },
    });
    expect(r.find((m) => m.id === '30x40')?.promocion).toBeUndefined();
  });

  it('rechaza precios absurdos', () => {
    const r = aplicarEdiciones(negocio.medidas, { '30x40': { precio: 1e300 } });
    expect(r.find((m) => m.id === '30x40')?.precio).toBe(60000);
  });
});
