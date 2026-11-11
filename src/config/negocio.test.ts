import { describe, expect, it } from 'vitest';
import { negocio } from './negocio';

// Las imágenes que existen en public/, vistas por Vite (sin depender de los tipos de Node).
const enPublic = Object.keys(import.meta.glob('/public/**/*.webp')).map((r) =>
  r.replace('/public', ''),
);

const precios = (linea: 'catalogo' | 'personalizado') =>
  Object.fromEntries(negocio.medidas.filter((m) => m.linea === linea).map((m) => [m.id, m.precio]));

describe('negocio', () => {
  it('tiene los precios del catálogo del taller', () => {
    expect(precios('catalogo')).toEqual({
      '13x18': 42000,
      '20x25': 58000,
      '30x38': 75000,
      '20x50': 78000,
      '30x40': 78000,
      '35x50-acrilico': 95000,
      '35x50': 140000,
      '50x70': 265000,
      '50x100': 375000,
      '70x100': 475000,
    });
  });

  it('tiene los precios de los personalizados', () => {
    expect(precios('personalizado')).toEqual({
      'p-20x25': 65000,
      'p-30x38': 80000,
      'p-20x50': 85000,
      'p-30x40': 85000,
      'p-35x50-acrilico': 105000,
      'p-35x50': 160000,
      'p-50x70': 270000,
      'p-70x100': 480000,
    });
  });

  it('un personalizado nunca cuesta menos que el mismo tamaño del catálogo', () => {
    for (const p of negocio.medidas.filter((m) => m.linea === 'personalizado')) {
      const base = negocio.medidas.find((m) => m.id === p.id.slice(2));
      expect(base, p.id).toBeDefined();
      expect(p.precio).toBeGreaterThan(base!.precio);
      expect(p.frontal).toBe(base!.frontal);
    }
  });

  it('guarda todo el dinero como enteros y no tiene ids repetidos', () => {
    for (const m of negocio.medidas) expect(Number.isInteger(m.precio)).toBe(true);
    for (const mat of negocio.materiales) expect(mat.recargo).toBe(0);
    expect(new Set(negocio.medidas.map((m) => m.id)).size).toBe(negocio.medidas.length);
  });

  it('define las medidas en vertical (ancho < alto)', () => {
    for (const m of negocio.medidas) expect(m.anchoCm).toBeLessThan(m.altoCm);
  });

  it('cada diseño y cada entrega tiene su imagen en public/', () => {
    const fotos = [
      ...negocio.catalogo.map((d) => d.foto?.src),
      ...negocio.entregas.map((f) => f.src),
    ];
    expect(fotos.length).toBeGreaterThan(30);
    for (const src of fotos) expect(enPublic, src).toContain(src);
    expect(new Set(negocio.catalogo.map((d) => d.id)).size).toBe(negocio.catalogo.length);
  });

  it('trae la marca y los valores por defecto', () => {
    expect(negocio.marca.nombre).toBe('RaceTrack Posters');
    expect(negocio.marca.prefijoPedido).toBe('RT');
    expect(negocio.orientaciones).toEqual(['vertical', 'horizontal']);
    expect(negocio.archivo).toEqual({
      tamanoMaxMB: 25,
      tipos: ['image/jpeg', 'image/png', 'image/webp'],
    });
    // Formato internacional sin «+», como lo pide wa.me.
    expect(negocio.whatsapp.numero).toMatch(/^57\d{10}$/);
    expect(negocio.pagos.porcentajeAbono).toBe(50);
    expect(negocio.envio.tarifas).toHaveLength(3);
  });
});
