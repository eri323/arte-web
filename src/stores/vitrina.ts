import { atom } from 'nanostores';
import { borrarFotoPendiente } from './foto-pendiente';

// La imagen que el cliente suelta en la portada para verla colgada en la pared. Es un ObjectURL
// del archivo local: vive solo en memoria y nunca sale del navegador (regla 3 de la fase 1).
// La comparten dos islas: la zona para soltar la imagen y la pared.

export interface ImagenPropia {
  url: string;
  nombre: string;
}

export const $imagenPropia = atom<ImagenPropia | null>(null);

/** Cambia la imagen y libera el ObjectURL anterior. */
export function ponerImagenPropia(nueva: ImagenPropia | null) {
  const anterior = $imagenPropia.get();
  if (anterior && anterior.url !== nueva?.url) URL.revokeObjectURL(anterior.url);
  // Si el cliente quita su foto, /crear ya no debe recibirla.
  if (!nueva) void borrarFotoPendiente();
  $imagenPropia.set(nueva);
}
