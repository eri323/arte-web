import { crearPedidosDemo } from './datos-demo';
import type { Pedido } from './pedidos';

/**
 * Dónde viven los pedidos. En la fase 1 es localStorage; en la fase 2 se cambia por Supabase sin
 * tocar los componentes, porque todos usan esta interfaz.
 */
export interface AlmacenPedidos {
  /** Más nuevos primero. */
  listar(): Promise<Pedido[]>;
  obtener(numero: string): Promise<Pedido | null>;
  guardar(pedido: Pedido): Promise<void>;
  restaurarDemo(): Promise<void>;
}

/** Lo mínimo de `Storage` que se usa; facilita las pruebas. */
export interface AlmacenamientoClaveValor {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

export const CLAVE_PEDIDOS = 'arte-web:pedidos';

export function crearAlmacenLocal(
  storage: AlmacenamientoClaveValor,
  opciones: { ahora?: () => Date; clave?: string } = {},
): AlmacenPedidos {
  const ahora = opciones.ahora ?? (() => new Date());
  const clave = opciones.clave ?? CLAVE_PEDIDOS;

  function escribir(pedidos: Pedido[]): void {
    storage.setItem(clave, JSON.stringify(pedidos));
  }

  function leer(): Pedido[] {
    const crudo = storage.getItem(clave);
    if (crudo !== null) {
      try {
        const datos: unknown = JSON.parse(crudo);
        if (Array.isArray(datos)) return datos as Pedido[];
      } catch {
        // Datos dañados: se vuelve a la demo.
      }
    }
    const demo = crearPedidosDemo(ahora());
    escribir(demo);
    return demo;
  }

  const normalizar = (numero: string) => numero.trim().toUpperCase();
  const fechaCreacion = (p: Pedido) => p.historial[0]?.fecha ?? '';

  return {
    async listar() {
      return [...leer()].sort((a, b) => fechaCreacion(b).localeCompare(fechaCreacion(a)));
    },
    async obtener(numero) {
      return leer().find((p) => p.numero === normalizar(numero)) ?? null;
    },
    async guardar(pedido) {
      const pedidos = leer().filter((p) => p.numero !== pedido.numero);
      escribir([...pedidos, pedido]);
    },
    async restaurarDemo() {
      escribir(crearPedidosDemo(ahora()));
    },
  };
}

let almacenNavegador: AlmacenPedidos | null = null;

/** Almacén del navegador. Solo se llama desde islas (en el cliente). */
export function obtenerAlmacen(): AlmacenPedidos {
  almacenNavegador ??= crearAlmacenLocal(window.localStorage);
  return almacenNavegador;
}
