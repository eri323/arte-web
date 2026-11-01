import type { Medida, Promocion } from '../config/negocio';
import { etiquetaMedida, formatearPesos } from './formato';
import { calcularAbono } from './pedidos';

export interface ItemPrecio {
  medidaId: string;
  cantidad: number;
}

export interface LineaMedida {
  medidaId: string;
  cantidad: number;
  /** Sin promoción. */
  subtotal: number;
  descuento: number;
  total: number;
}

export interface Desglose {
  lineas: LineaMedida[];
  subtotal: number;
  descuento: number;
  total: number;
  abono: number;
  saldo: number;
}

function validarCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error(`La cantidad debe ser un entero mayor que 0: ${cantidad}`);
  }
}

/** Precio de N cuadros de una misma medida, con su promoción aplicada. */
export function calcularLineaMedida(medida: Medida, cantidad: number): LineaMedida {
  validarCantidad(cantidad);
  const subtotal = medida.precio * cantidad;
  const promo = medida.promocion;
  let total = subtotal;

  if (promo?.tipo === 'desde' && cantidad >= promo.cantidadMinima) {
    total = promo.precioUnitario * cantidad;
  } else if (promo?.tipo === 'paquete') {
    // SUPUESTO: floor(n / cantidad) × precioPaquete + (n % cantidad) × precio (sección 6).
    total =
      Math.floor(cantidad / promo.cantidad) * promo.precioPaquete +
      (cantidad % promo.cantidad) * medida.precio;
  }

  return { medidaId: medida.id, cantidad, subtotal, descuento: subtotal - total, total };
}

/**
 * Desglose del carrito. SUPUESTO: la promoción aplica por medida, sumando todos los ítems de esa
 * medida aunque tengan fotos distintas; las medidas distintas no se combinan.
 */
export function calcularDesglose(
  items: ItemPrecio[],
  medidas: Medida[],
  porcentajeAbono: number,
): Desglose {
  const cantidades = new Map<string, number>();
  for (const item of items) {
    validarCantidad(item.cantidad);
    if (!medidas.some((m) => m.id === item.medidaId)) {
      throw new Error(`Medida desconocida: ${item.medidaId}`);
    }
    cantidades.set(item.medidaId, (cantidades.get(item.medidaId) ?? 0) + item.cantidad);
  }

  const lineas = medidas
    .filter((m) => cantidades.has(m.id))
    .map((m) => calcularLineaMedida(m, cantidades.get(m.id) ?? 0));

  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const total = lineas.reduce((s, l) => s + l.total, 0);
  const abono = calcularAbono(total, porcentajeAbono);
  return { lineas, subtotal, descuento: subtotal - total, total, abono, saldo: total - abono };
}

export interface SugerenciaPromocion {
  faltan: number;
  mensaje: string;
}

/**
 * "Agrega N más…" cuando al cliente le faltan unidades para la promoción de esa medida.
 * SUPUESTO: se muestra siempre que falte al menos 1 (no solo cuando faltan "pocas"), porque en
 * las promociones actuales nunca faltan más de 4.
 */
export function sugerenciaPromocion(medida: Medida, cantidad: number): SugerenciaPromocion | null {
  const promo = medida.promocion;
  if (!promo || cantidad <= 0) return null;
  const etiqueta = etiquetaMedida(medida);

  if (promo.tipo === 'desde') {
    const faltan = promo.cantidadMinima - cantidad;
    if (faltan <= 0) return null;
    return {
      faltan,
      mensaje: `Agrega ${faltan} más de ${etiqueta} y pagas ${formatearPesos(promo.precioUnitario)} c/u`,
    };
  }

  const resto = cantidad % promo.cantidad;
  if (resto === 0) return null;
  const faltan = promo.cantidad - resto;
  return {
    faltan,
    mensaje: `Agrega ${faltan} más de ${etiqueta} y llevas ${promo.cantidad} por ${formatearPesos(promo.precioPaquete)}`,
  };
}

/** "3 o más a $ 40.000 c/u" o "2 por $ 130.000"; vacío si no hay promoción. */
export function describirPromocion(promocion: Promocion | undefined): string {
  if (!promocion) return '';
  return promocion.tipo === 'desde'
    ? `${promocion.cantidadMinima} o más a ${formatearPesos(promocion.precioUnitario)} c/u`
    : `${promocion.cantidad} por ${formatearPesos(promocion.precioPaquete)}`;
}

/** Cambios hechos en el panel del taller. `promocion: null` quita la promoción. */
export type EdicionesPrecios = Record<string, { precio?: number; promocion?: Promocion | null }>;

// SUPUESTO: ningún precio editado pasa de $100.000.000; protege de datos manipulados en localStorage.
const PRECIO_MAXIMO = 100_000_000;

const enteroPositivo = (n: unknown): n is number =>
  Number.isInteger(n) && (n as number) > 0 && (n as number) <= PRECIO_MAXIMO;

/** Una promoción tiene que salir más barata que comprar las mismas unidades sueltas. */
function promocionAbarata(p: Promocion, precio: number): boolean {
  return p.tipo === 'desde' ? p.precioUnitario < precio : p.precioPaquete < p.cantidad * precio;
}

function promocionValida(p: Promocion): boolean {
  return p.tipo === 'desde'
    ? enteroPositivo(p.cantidadMinima) && enteroPositivo(p.precioUnitario)
    : p.tipo === 'paquete' &&
        p.cantidad >= 2 &&
        enteroPositivo(p.cantidad) &&
        enteroPositivo(p.precioPaquete);
}

/** Aplica sobre las medidas de negocio.ts lo editado en el panel, ignorando valores inválidos. */
export function aplicarEdiciones(medidas: Medida[], ediciones: EdicionesPrecios): Medida[] {
  return medidas.map((medida) => {
    const edicion = ediciones[medida.id];
    if (!edicion) return medida;
    const resultado: Medida = { ...medida };
    if (enteroPositivo(edicion.precio)) resultado.precio = edicion.precio;
    if (edicion.promocion === null) delete resultado.promocion;
    else if (
      edicion.promocion &&
      promocionValida(edicion.promocion) &&
      promocionAbarata(edicion.promocion, resultado.precio)
    ) {
      resultado.promocion = edicion.promocion;
    }
    if (resultado.promocion && !promocionAbarata(resultado.promocion, resultado.precio)) {
      delete resultado.promocion;
    }
    return resultado;
  });
}
