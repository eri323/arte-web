import type { Encargo } from './carrito';
import type { MaterialId, Orientacion } from '../config/negocio';
import { formatearNumeroPedido, parsearNumeroPedido } from './formato';
import type { Calidad } from './resolucion';

export const ESTADOS = [
  'recibido',
  'abono_confirmado',
  'en_produccion',
  'listo',
  'saldo_pagado',
  'enviado',
  'entregado',
] as const;

export type EstadoPedido = (typeof ESTADOS)[number];

export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'Pedido recibido',
  abono_confirmado: 'Abono confirmado',
  en_produccion: 'En producción',
  listo: 'Listo, falta pagar el saldo',
  saldo_pagado: 'Saldo pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
};

export interface ItemPedido {
  medidaId: string;
  orientacion: Orientacion;
  material: MaterialId;
  cantidad: number;
  archivo: string;
  calidad: Calidad;
  dpi: number;
  /** Diseño del catálogo; `archivo` lleva su nombre. */
  disenoId?: string;
  /** Personalizado: el vehículo del cliente y sus detalles. */
  encargo?: Encargo;
}

export interface Pago {
  monto: number;
  fecha: string;
  nota: string;
}

export interface Nota {
  fecha: string;
  texto: string;
}

export interface Envio {
  transportadora: string;
  guia: string;
}

export interface Cliente {
  nombre: string;
  ciudad: string;
  celular?: string;
  nota?: string;
}

export interface Pedido {
  numero: string;
  cliente: Cliente;
  items: ItemPedido[];
  total: number;
  pagos: Pago[];
  estado: EstadoPedido;
  historial: { estado: EstadoPedido; fecha: string }[];
  /** "AAAA-MM-DD". */
  fechaEstimada?: string;
  /** Notas del taller visibles para el cliente. */
  notas: Nota[];
  envio?: Envio;
}

function validarEntero(valor: number, nombre: string): void {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`${nombre} debe ser un entero en pesos mayor o igual a 0: ${valor}`);
  }
}

// SUPUESTO: abono = Math.ceil(total × porcentajeAbono / 100) y saldo = total − abono (sección 6).
export function calcularAbono(total: number, porcentajeAbono: number): number {
  validarEntero(total, 'El total');
  return Math.ceil((total * porcentajeAbono) / 100);
}

export function calcularSaldo(total: number, porcentajeAbono: number): number {
  return total - calcularAbono(total, porcentajeAbono);
}

export function totalPagado(pedido: Pick<Pedido, 'pagos'>): number {
  return pedido.pagos.reduce((s, p) => s + p.monto, 0);
}

export function saldoPendiente(pedido: Pick<Pedido, 'pagos' | 'total'>): number {
  return Math.max(0, pedido.total - totalPagado(pedido));
}

export function crearPedido(datos: {
  numero: string;
  cliente: Cliente;
  items: ItemPedido[];
  total: number;
  fecha: string;
}): Pedido {
  validarEntero(datos.total, 'El total');
  return {
    numero: datos.numero,
    cliente: datos.cliente,
    items: datos.items,
    total: datos.total,
    pagos: [],
    estado: 'recibido',
    historial: [{ estado: 'recibido', fecha: datos.fecha }],
    notas: [],
  };
}

export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  return ESTADOS[ESTADOS.indexOf(estado) + 1] ?? null;
}

/**
 * SUPUESTO: el pedido solo avanza al estado siguiente, sin saltos ni retrocesos. Además:
 * - abono_confirmado exige pagos por al menos el abono;
 * - saldo_pagado exige pagos por el total;
 * - enviado exige transportadora y guía.
 */
export function puedeTransicionar(
  pedido: Pedido,
  hacia: EstadoPedido,
  porcentajeAbono: number,
): { ok: true } | { ok: false; motivo: string } {
  if (siguienteEstado(pedido.estado) !== hacia) {
    return { ok: false, motivo: 'Solo se puede avanzar al estado siguiente.' };
  }
  const pagado = totalPagado(pedido);
  if (hacia === 'abono_confirmado' && pagado < calcularAbono(pedido.total, porcentajeAbono)) {
    return { ok: false, motivo: `Falta registrar el abono del ${porcentajeAbono}%.` };
  }
  if (hacia === 'saldo_pagado' && pagado < pedido.total) {
    return { ok: false, motivo: 'Falta pagar el saldo.' };
  }
  if (hacia === 'enviado' && !pedido.envio) {
    return { ok: false, motivo: 'Falta la transportadora y el número de guía.' };
  }
  return { ok: true };
}

export function transicionar(
  pedido: Pedido,
  hacia: EstadoPedido,
  fecha: string,
  porcentajeAbono: number,
): Pedido {
  const resultado = puedeTransicionar(pedido, hacia, porcentajeAbono);
  if (!resultado.ok) throw new Error(resultado.motivo);
  return { ...pedido, estado: hacia, historial: [...pedido.historial, { estado: hacia, fecha }] };
}

export function registrarPago(pedido: Pedido, pago: Pago): Pedido {
  if (!Number.isInteger(pago.monto) || pago.monto <= 0) {
    throw new Error(`El pago debe ser un entero en pesos mayor que 0: ${pago.monto}`);
  }
  if (pago.monto > saldoPendiente(pedido)) {
    throw new Error('El pago es mayor que el saldo pendiente.');
  }
  return { ...pedido, pagos: [...pedido.pagos, { ...pago, nota: pago.nota.trim() }] };
}

export function agregarNota(pedido: Pedido, texto: string, fecha: string): Pedido {
  const limpio = texto.trim();
  if (!limpio) throw new Error('La nota está vacía.');
  return { ...pedido, notas: [...pedido.notas, { fecha, texto: limpio }] };
}

export function fijarFechaEstimada(pedido: Pedido, fecha: string | undefined): Pedido {
  const copia = { ...pedido, fechaEstimada: fecha };
  if (!fecha) delete copia.fechaEstimada;
  return copia;
}

export function fijarEnvio(pedido: Pedido, envio: Envio): Pedido {
  const transportadora = envio.transportadora.trim();
  const guia = envio.guia.trim();
  if (!transportadora || !guia) throw new Error('Faltan la transportadora o la guía.');
  return { ...pedido, envio: { transportadora, guia } };
}

/** SUPUESTO: los pedidos del cliente empiezan en 1043, después de los tres pedidos demo. */
export const CONSECUTIVO_INICIAL = 1043;

export function siguienteNumero(pedidos: Pick<Pedido, 'numero'>[], prefijo: string): string {
  const mayor = pedidos
    .map((p) => parsearNumeroPedido(p.numero))
    .filter((n) => n?.prefijo === prefijo)
    .reduce((max, n) => Math.max(max, n?.consecutivo ?? 0), CONSECUTIVO_INICIAL - 1);
  return formatearNumeroPedido(prefijo, mayor + 1);
}

const lista = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

/**
 * Pedido leído de localStorage, que puede venir de una versión vieja o editado a mano. Completa
 * las listas que falten y descarta lo que no tenga número, total entero o un estado conocido.
 */
export function normalizarPedido(x: unknown): Pedido | null {
  if (typeof x !== 'object' || x === null) return null;
  const p = x as Partial<Pedido>;
  if (typeof p.numero !== 'string' || !Number.isInteger(p.total) || (p.total as number) < 0) {
    return null;
  }
  if (!p.estado || !ESTADOS.includes(p.estado)) return null;
  const cliente = typeof p.cliente === 'object' && p.cliente !== null ? p.cliente : null;
  return {
    ...p,
    numero: p.numero,
    total: p.total as number,
    estado: p.estado,
    cliente: {
      nombre: String(cliente?.nombre ?? ''),
      ciudad: String(cliente?.ciudad ?? ''),
      ...cliente,
    },
    items: lista(p.items),
    pagos: lista<Pago>(p.pagos).filter((pago) => Number.isInteger(pago?.monto)),
    historial: lista(p.historial),
    notas: lista(p.notas),
  };
}
