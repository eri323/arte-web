import { describe, expect, it } from 'vitest';
import { negocio } from './negocio';

describe('negocio', () => {
  it('tiene las 6 medidas de la sección 6 con sus precios', () => {
    expect(negocio.medidas.map((m) => [m.id, m.anchoCm, m.altoCm, m.precio])).toEqual([
      ['20x27', 20, 27, 30000],
      ['30x40', 30, 40, 60000],
      ['45x60', 45, 60, 80000],
      ['60x80', 60, 80, 130000],
      ['90x120', 90, 120, 250000],
      ['120x160', 120, 160, 330000],
    ]);
  });

  it('tiene las promociones de la sección 6', () => {
    const promo = Object.fromEntries(negocio.medidas.map((m) => [m.id, m.promocion]));
    expect(promo['20x27']).toEqual({ tipo: 'desde', cantidadMinima: 5, precioUnitario: 15000 });
    expect(promo['30x40']).toEqual({ tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 });
    expect(promo['45x60']).toEqual({ tipo: 'paquete', cantidad: 2, precioPaquete: 130000 });
    expect(promo['60x80']).toBeUndefined();
    expect(promo['90x120']).toBeUndefined();
    expect(promo['120x160']).toBeUndefined();
  });

  it('guarda todo el dinero como enteros', () => {
    for (const m of negocio.medidas) {
      expect(Number.isInteger(m.precio)).toBe(true);
      if (m.promocion?.tipo === 'desde')
        expect(Number.isInteger(m.promocion.precioUnitario)).toBe(true);
      if (m.promocion?.tipo === 'paquete')
        expect(Number.isInteger(m.promocion.precioPaquete)).toBe(true);
    }
    for (const mat of negocio.materiales) expect(mat.recargo).toBe(0);
  });

  it('define las medidas en vertical (ancho < alto)', () => {
    for (const m of negocio.medidas) expect(m.anchoCm).toBeLessThan(m.altoCm);
  });

  it('trae los valores por defecto de la sección 6', () => {
    expect(negocio.marca.nombre).toBe('Midas Atelier');
    expect(negocio.marca.prefijoPedido).toBe('MA');
    expect(negocio.orientaciones).toEqual(['vertical', 'horizontal']);
    expect(negocio.resolucion).toEqual({ buena: 150, regular: 100 });
    expect(negocio.archivo).toEqual({
      tamanoMaxMB: 25,
      tipos: ['image/jpeg', 'image/png', 'image/webp'],
    });
    expect(negocio.whatsapp.numero).toBe('');
    expect(negocio.pagos.porcentajeAbono).toBe(50);
    expect(negocio.envio.texto).toBe('Se cotiza por WhatsApp según tu ciudad');
  });
});
