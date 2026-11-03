// La foto que el cliente sube en la pared de la portada tiene que llegar a /crear. Como Astro genera
// páginas separadas, al navegar se pierde todo lo que vive en memoria, y la foto no cabe en
// localStorage. Por eso el archivo original se guarda en IndexedDB: sigue en el equipo del cliente
// y nunca sale del navegador (regla 3 de la fase 1). /crear la toma una vez y la borra.

const BASE = 'arte-web';
const TABLA = 'foto-pendiente';
const CLAVE = 'actual';

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(TABLA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function operar<T>(
  modo: IDBTransactionMode,
  accion: (tabla: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const pedido = accion(db.transaction(TABLA, modo).objectStore(TABLA));
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  } finally {
    db.close();
  }
}

// Si IndexedDB no está disponible (modo privado de algunos navegadores), el cliente solo tendrá que
// volver a subir la foto en /crear: no vale la pena mostrar un error.

export async function guardarFotoPendiente(archivo: File): Promise<void> {
  try {
    await operar('readwrite', (t) => t.put(archivo, CLAVE));
  } catch {
    /* sin IndexedDB: no pasa nada */
  }
}

export async function borrarFotoPendiente(): Promise<void> {
  try {
    await operar('readwrite', (t) => t.delete(CLAVE));
  } catch {
    /* sin IndexedDB: no pasa nada */
  }
}

/** Devuelve la foto pendiente (si hay) y la borra para que no reaparezca después. */
export async function tomarFotoPendiente(): Promise<File | null> {
  try {
    const archivo = await operar<unknown>('readonly', (t) => t.get(CLAVE));
    if (!(archivo instanceof File)) return null;
    await borrarFotoPendiente();
    return archivo;
  } catch {
    return null;
  }
}
