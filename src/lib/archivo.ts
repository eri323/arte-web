import type { Negocio } from '../config/negocio';

export const MENSAJE_HEIC =
  'Tu foto está en formato HEIC. Cámbiala a JPG (en iPhone: Ajustes › Cámara › Formatos › Más compatible) o envíala por WhatsApp';

export type ResultadoArchivo =
  { ok: true } | { ok: false; motivo: 'tipo' | 'tamano' | 'heic'; mensaje: string };

interface DatosArchivo {
  name: string;
  type: string;
  size: number;
}

export function esHeic(archivo: Pick<DatosArchivo, 'name' | 'type'>): boolean {
  return /^image\/hei[cf]/.test(archivo.type) || /\.hei[cf]$/i.test(archivo.name);
}

/**
 * Revisa formato y tamaño antes de abrir la foto. HEIC se devuelve aparte: el configurador intenta
 * decodificarlo y solo muestra el mensaje si el navegador no puede.
 */
export function validarArchivo(
  archivo: DatosArchivo,
  reglas: Negocio['archivo'],
): ResultadoArchivo {
  if (esHeic(archivo)) return { ok: false, motivo: 'heic', mensaje: MENSAJE_HEIC };
  if (!reglas.tipos.includes(archivo.type)) {
    return {
      ok: false,
      motivo: 'tipo',
      mensaje: 'Ese formato no se puede usar. Sube una foto JPG, PNG o WebP.',
    };
  }
  if (archivo.size > reglas.tamanoMaxMB * 1024 * 1024) {
    return {
      ok: false,
      motivo: 'tamano',
      mensaje: `La foto pesa más de ${reglas.tamanoMaxMB} MB. Envía una versión más liviana o mándala por WhatsApp.`,
    };
  }
  return { ok: true };
}

/** Reduce para que el lado largo no pase de `max`, sin agrandar. */
export function escalarDimensiones(
  ancho: number,
  alto: number,
  max: number,
): { ancho: number; alto: number } {
  const factor = Math.min(1, max / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}
