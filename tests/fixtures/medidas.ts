import type { Medida } from '../../src/config/negocio';

// Medidas de referencia para probar la lógica de precios y de resolución sin depender del taller
// configurado en negocio.ts: cubren las dos clases de promoción y las medidas sin promoción.
export const MEDIDAS: Medida[] = [
  {
    id: '20x27',
    anchoCm: 20,
    altoCm: 27,
    precio: 30000,
    promocion: { tipo: 'desde', cantidadMinima: 5, precioUnitario: 15000 },
    frontal: 'vidrio',
    linea: 'catalogo',
  },
  {
    id: '30x40',
    anchoCm: 30,
    altoCm: 40,
    precio: 60000,
    promocion: { tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 },
    frontal: 'vidrio',
    linea: 'catalogo',
  },
  {
    id: '45x60',
    anchoCm: 45,
    altoCm: 60,
    precio: 80000,
    promocion: { tipo: 'paquete', cantidad: 2, precioPaquete: 130000 },
    frontal: 'vidrio',
    linea: 'catalogo',
  },
  { id: '60x80', anchoCm: 60, altoCm: 80, precio: 130000, frontal: 'vidrio', linea: 'catalogo' },
  { id: '90x120', anchoCm: 90, altoCm: 120, precio: 250000, frontal: 'vidrio', linea: 'catalogo' },
  {
    id: '120x160',
    anchoCm: 120,
    altoCm: 160,
    precio: 330000,
    frontal: 'vidrio',
    linea: 'catalogo',
  },
];
