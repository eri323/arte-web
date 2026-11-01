import type { Medida, Orientacion } from '../config/negocio';

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const fechas = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Bogota',
});

/** Formatea pesos enteros, por ejemplo 40000 → "$ 40.000". */
export function formatearPesos(valor: number): string {
  if (!Number.isInteger(valor)) throw new Error(`El monto debe ser un entero en pesos: ${valor}`);
  return pesos.format(valor);
}

/** Acepta una fecha ISO completa o solo "AAAA-MM-DD" (que se toma como día en Colombia). */
export function formatearFecha(fecha: string): string {
  const soloDia = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  return fechas.format(new Date(soloDia ? `${fecha}T12:00:00-05:00` : fecha));
}

export function formatearNumeroPedido(prefijo: string, consecutivo: number): string {
  return `${prefijo}-${consecutivo}`;
}

export function parsearNumeroPedido(
  texto: string,
): { prefijo: string; consecutivo: number } | null {
  const coincidencia = /^([A-Z]+)-(\d+)$/.exec(texto.trim().toUpperCase());
  if (!coincidencia) return null;
  return { prefijo: coincidencia[1], consecutivo: Number(coincidencia[2]) };
}

/** "30×40" en vertical, "40×30" en horizontal. */
export function etiquetaMedida(
  medida: Pick<Medida, 'anchoCm' | 'altoCm'>,
  orientacion: Orientacion = 'vertical',
): string {
  const [ancho, alto] =
    orientacion === 'horizontal'
      ? [medida.altoCm, medida.anchoCm]
      : [medida.anchoCm, medida.altoCm];
  return `${ancho}×${alto}`;
}
