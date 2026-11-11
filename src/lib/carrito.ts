import type { MaterialId, Orientacion } from '../config/negocio';
import type { AreaPorcentaje, Calidad, Dimensiones } from './resolucion';

/** Póster personalizado: el vehículo del cliente, que el taller ilustra por encargo. */
export interface Encargo {
  /** Marca, modelo y año, como los escribió el cliente. */
  vehiculo: string;
  /** Color, rines, placa, fondo y demás detalles. */
  detalles: string;
  /** Cuántas fotos de referencia va a adjuntar en el chat. */
  fotos: number;
}

function esEncargo(x: unknown): x is Encargo {
  return (
    typeof x === 'object' &&
    x !== null &&
    typeof (x as Encargo).vehiculo === 'string' &&
    typeof (x as Encargo).detalles === 'string' &&
    Number.isInteger((x as Encargo).fotos)
  );
}

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
  /** Diseño del catálogo (sin foto propia). En ese caso `archivo` es el nombre del diseño. */
  disenoId?: string;
  /** Variante de color del diseño del catálogo (sin ella, los colores originales). */
  variante?: string;
  /** Personalizado. En ese caso `archivo` es el vehículo y no hay recorte ni calidad que medir. */
  encargo?: Encargo;
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const esNumero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function esItemValido(x: unknown, idsMedidas: string[]): x is ItemCarrito {
  if (!esObjeto(x)) return false;
  const { recorte, dimensiones } = x;
  return (
    typeof x.id === 'string' &&
    typeof x.medidaId === 'string' &&
    idsMedidas.includes(x.medidaId) &&
    (x.orientacion === 'vertical' || x.orientacion === 'horizontal') &&
    (x.material === 'vidrio' || x.material === 'acrilico') &&
    Number.isInteger(x.cantidad) &&
    (x.cantidad as number) >= 1 &&
    esObjeto(recorte) &&
    [recorte.x, recorte.y, recorte.width, recorte.height].every(esNumero) &&
    esObjeto(dimensiones) &&
    esNumero(dimensiones.ancho) &&
    esNumero(dimensiones.alto) &&
    typeof x.archivo === 'string' &&
    esNumero(x.dpi) &&
    (x.calidad === 'buena' || x.calidad === 'regular' || x.calidad === 'baja') &&
    (x.disenoId === undefined || typeof x.disenoId === 'string') &&
    (x.variante === undefined || typeof x.variante === 'string') &&
    (x.encargo === undefined || esEncargo(x.encargo))
  );
}

/**
 * Lo que viene de localStorage puede ser de una versión vieja o de otro taller: se descartan los
 * ítems con forma inválida o con una medida que ya no existe, para que /pedido no se caiga.
 */
export function sanearCarrito(datos: unknown, idsMedidas: string[]): ItemCarrito[] {
  return Array.isArray(datos) ? datos.filter((x) => esItemValido(x, idsMedidas)) : [];
}
