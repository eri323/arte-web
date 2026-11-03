import { describe, expect, it } from 'vitest';
import { sanearCarrito } from './carrito';

const valido = {
  id: 'a',
  medidaId: '30x40',
  orientacion: 'vertical',
  material: 'mdf',
  cantidad: 2,
  recorte: { x: 0, y: 0, width: 100, height: 100 },
  archivo: 'foto.jpg',
  dimensiones: { ancho: 3024, alto: 4032 },
  dpi: 256,
  calidad: 'buena',
};

describe('sanearCarrito', () => {
  const ids = ['20x27', '30x40'];

  it('deja pasar los ítems válidos', () => {
    expect(sanearCarrito([valido], ids)).toEqual([valido]);
  });

  it('acepta un diseño del catálogo y descarta un disenoId que no es texto', () => {
    const diseno = { ...valido, archivo: 'Ronin', disenoId: 'ronin' };
    expect(sanearCarrito([diseno, { ...valido, disenoId: 7 }], ids)).toEqual([diseno]);
  });

  it('acepta la variante de color y descarta una que no es texto', () => {
    const conColor = {
      ...valido,
      archivo: 'Ronin en rojo led',
      disenoId: 'ronin',
      variante: 'led',
    };
    expect(sanearCarrito([conColor, { ...conColor, variante: 3 }], ids)).toEqual([conColor]);
  });

  it.each([
    ['medida que ya no existe', { ...valido, medidaId: '120x160' }],
    ['cantidad cero', { ...valido, cantidad: 0 }],
    ['cantidad con decimales', { ...valido, cantidad: 1.5 }],
    ['material desconocido', { ...valido, material: 'vidrio' }],
    ['sin recorte', { ...valido, recorte: undefined }],
    ['sin id', { ...valido, id: undefined }],
    ['no es objeto', 'hola'],
    ['null', null],
  ])('descarta: %s', (_, item) => {
    expect(sanearCarrito([valido, item], ids)).toEqual([valido]);
  });

  it('si no es un arreglo devuelve vacío', () => {
    expect(sanearCarrito({ a: 1 }, ids)).toEqual([]);
  });
});
