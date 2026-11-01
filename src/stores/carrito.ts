import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import type { MaterialId, Orientacion } from '../config/negocio';
import type { AreaPorcentaje, Calidad, Dimensiones } from '../lib/resolucion';

// El carrito sobrevive a la navegación entre páginas (localStorage). La imagen NO se guarda aquí
// porque no cabe: solo el nombre del archivo, sus dimensiones y el recorte en porcentaje.

export interface ItemCarrito {
  id: string;
  medidaId: string;
  orientacion: Orientacion;
  material: MaterialId;
  cantidad: number;
  recorte: AreaPorcentaje;
  archivo: string;
  dimensiones: Dimensiones;
  dpi: number;
  calidad: Calidad;
}

function leerCarrito(texto: string): ItemCarrito[] {
  try {
    const datos: unknown = JSON.parse(texto);
    return Array.isArray(datos) ? (datos as ItemCarrito[]) : [];
  } catch {
    return [];
  }
}

export const $carrito = persistentAtom<ItemCarrito[]>('arte-web:carrito', [], {
  encode: JSON.stringify,
  decode: leerCarrito,
});

export const $cantidadCarrito = computed($carrito, (items) =>
  items.reduce((suma, item) => suma + item.cantidad, 0),
);

function nuevoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function agregarAlCarrito(item: Omit<ItemCarrito, 'id'>): string {
  const id = nuevoId();
  $carrito.set([...$carrito.get(), { ...item, id }]);
  return id;
}

export function cambiarCantidad(id: string, cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad < 1) return;
  $carrito.set($carrito.get().map((item) => (item.id === id ? { ...item, cantidad } : item)));
}

export function quitarDelCarrito(id: string): void {
  $carrito.set($carrito.get().filter((item) => item.id !== id));
}

export function vaciarCarrito(): void {
  $carrito.set([]);
}
