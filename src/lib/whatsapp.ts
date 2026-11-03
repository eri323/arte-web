import type { MaterialId, Negocio, Orientacion } from '../config/negocio';
import { etiquetaMedida, formatearPesos } from './formato';
import type { Cliente } from './pedidos';
import type { Desglose } from './precios';
import type { Calidad } from './resolucion';

export const MAX_CARACTERES_MENSAJE = 1800;

export interface ItemMensaje {
  medidaId: string;
  orientacion: Orientacion;
  material: MaterialId;
  cantidad: number;
  archivo: string;
  calidad: Calidad;
  /** Diseño del catálogo: no hay foto que adjuntar y `archivo` es el nombre del diseño. */
  disenoId?: string;
}

export interface DatosMensaje {
  numero: string;
  items: ItemMensaje[];
  desglose: Desglose;
  cliente: Cliente;
  negocio: Pick<Negocio, 'medidas' | 'materiales' | 'envio' | 'pagos'>;
}

type Modo = 'detallado' | 'compacto';

function recortar(texto: string, max: number): string {
  return texto.length <= max ? texto : `${texto.slice(0, max - 1)}…`;
}

function lineasItems(datos: DatosMensaje, modo: Modo, limite = datos.items.length): string[] {
  const { medidas, materiales } = datos.negocio;
  const lineas = datos.items.slice(0, limite).flatMap((item, i) => {
    const medida = medidas.find((m) => m.id === item.medidaId);
    const etiqueta = medida ? etiquetaMedida(medida, item.orientacion) : item.medidaId;
    const material = materiales.find((m) => m.id === item.material)?.nombre ?? item.material;
    if (modo === 'detallado') {
      return [
        `${i + 1}. ${etiqueta} ${item.orientacion} · ${material} · x${item.cantidad}`,
        item.disenoId
          ? `   Diseño del catálogo: ${item.archivo}`
          : `   Foto: ${item.archivo} · calidad ${item.calidad}`,
      ];
    }
    const o = item.orientacion === 'horizontal' ? 'H' : 'V';
    return [
      item.disenoId
        ? `${i + 1}. ${etiqueta} ${o} ${material} x${item.cantidad} · Diseño ${recortar(item.archivo, 24)}`
        : `${i + 1}. ${etiqueta} ${o} ${material} x${item.cantidad} · ${recortar(item.archivo, 24)} (${item.calidad})`,
    ];
  });
  const faltantes = datos.items.length - limite;
  if (faltantes > 0) lineas.push(`…y ${faltantes} ítems más (te los detallo en el chat).`);
  return lineas;
}

function armar(datos: DatosMensaje, modo: Modo, limite?: number): string {
  const { desglose, cliente, negocio } = datos;
  const lineasDesglose = desglose.lineas.map((l) => {
    const etiqueta = l.medidaId.replace('x', '×');
    return l.descuento > 0
      ? `${etiqueta} x${l.cantidad}: ${formatearPesos(l.subtotal)} − ${formatearPesos(l.descuento)} = ${formatearPesos(l.total)}`
      : `${etiqueta} x${l.cantidad}: ${formatearPesos(l.total)}`;
  });

  const partes = [
    `¡Hola! Quiero hacer este pedido.`,
    `Pedido: ${datos.numero}`,
    '',
    'Cuadros:',
    ...lineasItems(datos, modo, limite),
    '',
    'Desglose:',
    ...lineasDesglose,
    `Subtotal: ${formatearPesos(desglose.subtotal)}`,
    `Descuento: ${formatearPesos(desglose.descuento)}`,
    `Total: ${formatearPesos(desglose.total)}`,
    `Abono (${negocio.pagos.porcentajeAbono}%): ${formatearPesos(desglose.abono)}`,
    `Saldo: ${formatearPesos(desglose.saldo)}`,
    '',
    `Nombre: ${recortar(cliente.nombre, 80)}`,
    `Ciudad: ${recortar(cliente.ciudad, 60)}`,
    ...(cliente.celular ? [`Celular: ${recortar(cliente.celular, 20)}`] : []),
    ...(cliente.nota ? [`Nota: ${recortar(cliente.nota, 200)}`] : []),
    `Envío: ${negocio.envio.texto}`,
    // Fase 1: las imágenes no salen del navegador, así que se mandan aparte. Los diseños del
    // catálogo ya los tiene el taller.
    ...(datos.items.some((i) => !i.disenoId) ? ['', 'Adjunto mis fotos en este chat.'] : []),
  ];
  return partes.join('\n');
}

/**
 * Mensaje del pedido. Si se pasa de MAX_CARACTERES_MENSAJE, primero compacta cada ítem a una línea
 * y, si aún no cabe, resume los últimos ítems en una línea.
 */
export function construirMensaje(datos: DatosMensaje): string {
  const detallado = armar(datos, 'detallado');
  if (detallado.length <= MAX_CARACTERES_MENSAJE) return detallado;

  for (let limite = datos.items.length; limite >= 0; limite--) {
    const compacto = armar(datos, 'compacto', limite);
    if (compacto.length <= MAX_CARACTERES_MENSAJE) return compacto;
  }
  return armar(datos, 'compacto', 0).slice(0, MAX_CARACTERES_MENSAJE);
}

export function esModoDemo(numero: string): boolean {
  return numero.replace(/\D/g, '') === '';
}

/** URL de wa.me, o null en modo demo (número vacío). */
export function urlWhatsApp(numero: string, mensaje: string): string | null {
  const limpio = numero.replace(/\D/g, '');
  if (!limpio) return null;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}
