// Miniaturas de los recortes en sessionStorage: duran lo que dura la pestaña. Si se pierden, el
// pedido muestra un aviso en lugar de la imagen.

const prefijo = 'arte-web:miniatura:';

export function guardarMiniatura(id: string, dataUrl: string): void {
  try {
    sessionStorage.setItem(prefijo + id, dataUrl);
  } catch {
    // Sin espacio o sin sessionStorage: el pedido mostrará el aviso.
  }
}

export function leerMiniatura(id: string): string | null {
  try {
    return sessionStorage.getItem(prefijo + id);
  } catch {
    return null;
  }
}

export function borrarMiniatura(id: string): void {
  try {
    sessionStorage.removeItem(prefijo + id);
  } catch {
    // Nada que hacer.
  }
}
