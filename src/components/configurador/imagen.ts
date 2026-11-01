import { escalarDimensiones } from '../../lib/archivo';
import type { AreaPorcentaje, Dimensiones } from '../../lib/resolucion';

/** Lado largo de la vista previa. Una foto de 48 MP a tamaño real agota la memoria del celular. */
const LADO_VISTA_PREVIA = 2000;

export interface FotoAbierta {
  /** Dimensiones reales, ya con la orientación EXIF aplicada. */
  original: Dimensiones;
  /** ObjectURL de la vista previa reducida. Hay que liberarlo con URL.revokeObjectURL. */
  vistaPrevia: string;
}

function lienzoABlob(lienzo: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    lienzo.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo crear la vista previa'))),
      'image/jpeg',
      0.9,
    ),
  );
}

async function vistaPreviaDesde(fuente: CanvasImageSource, original: Dimensiones): Promise<string> {
  const destino = escalarDimensiones(original.ancho, original.alto, LADO_VISTA_PREVIA);
  const lienzo = document.createElement('canvas');
  lienzo.width = destino.ancho;
  lienzo.height = destino.alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.drawImage(fuente, 0, 0, destino.ancho, destino.alto);
  const blob = await lienzoABlob(lienzo);
  lienzo.width = 0;
  lienzo.height = 0;
  return URL.createObjectURL(blob);
}

/** Decodifica la foto, lee sus dimensiones reales y genera la vista previa reducida. */
export async function abrirFoto(archivo: File): Promise<FotoAbierta> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    // Plan B para navegadores (WebKit viejo) que no aceptan la opción imageOrientation: un <img>
    // moderno ya aplica la orientación EXIF.
    const url = URL.createObjectURL(archivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const original = { ancho: img.naturalWidth, alto: img.naturalHeight };
      return { original, vistaPrevia: await vistaPreviaDesde(img, original) };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  try {
    const original = { ancho: bitmap.width, alto: bitmap.height };
    return { original, vistaPrevia: await vistaPreviaDesde(bitmap, original) };
  } finally {
    bitmap.close();
  }
}

/** Miniatura del recorte (JPEG en data URL) para mostrar en el pedido durante la sesión. */
export async function crearMiniatura(
  vistaPrevia: string,
  recorte: AreaPorcentaje,
  ladoMax = 320,
): Promise<string> {
  const img = new Image();
  img.src = vistaPrevia;
  await img.decode();
  const sx = (recorte.x / 100) * img.naturalWidth;
  const sy = (recorte.y / 100) * img.naturalHeight;
  const sw = (recorte.width / 100) * img.naturalWidth;
  const sh = (recorte.height / 100) * img.naturalHeight;
  const destino = escalarDimensiones(sw, sh, ladoMax);
  const lienzo = document.createElement('canvas');
  lienzo.width = destino.ancho;
  lienzo.height = destino.alto;
  lienzo.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, destino.ancho, destino.alto);
  return lienzo.toDataURL('image/jpeg', 0.8);
}
