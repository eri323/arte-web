import type { MaterialId, Orientacion } from '../config/negocio';
import type { AreaPorcentaje, Calidad, Dimensiones } from './resolucion';

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
    (x.material === 'mdf' || x.material === 'acrilico') &&
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
    (x.disenoId === undefined || typeof x.disenoId === 'string')
  );
}

/**
 * Lo que viene de localStorage puede ser de una versión vieja o de otro taller: se descartan los
 * ítems con forma inválida o con una medida que ya no existe, para que /pedido no se caiga.
 */
export function sanearCarrito(datos: unknown, idsMedidas: string[]): ItemCarrito[] {
  return Array.isArray(datos) ? datos.filter((x) => esItemValido(x, idsMedidas)) : [];
}
