import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { negocio } from '../../config/negocio';
import { obtenerAlmacen } from '../../lib/almacen';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { crearPedido, siguienteNumero, type Cliente } from '../../lib/pedidos';
import { calcularDesglose, sugerenciaPromocion } from '../../lib/precios';
import { construirMensaje, esModoDemo, urlWhatsApp } from '../../lib/whatsapp';
import {
  $carrito,
  cambiarCantidad,
  quitarDelCarrito,
  vaciarCarrito,
  type ItemCarrito,
} from '../../stores/carrito';
import { borrarMiniatura, leerMiniatura } from '../../stores/miniaturas';
import { $medidas } from '../../stores/precios';

const AVISO_DEMO = 'En la versión real esto abre el WhatsApp del taller.';

function Miniatura({ item }: { item: ItemCarrito }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => setSrc(leerMiniatura(item.id)), [item.id]);
  if (src === undefined) return <div className="size-20 shrink-0 rounded bg-white/5" />;
  if (!src) {
    return (
      <p className="flex size-20 shrink-0 items-center rounded bg-white/5 p-1 text-center text-[0.7rem] leading-tight text-texto-suave">
        Vista previa no disponible
      </p>
    );
  }
  return (
    <img
      src={src}
      alt={`Recorte de ${item.archivo}`}
      className="size-20 shrink-0 rounded object-contain"
    />
  );
}

const nombreMaterial = (id: string) => negocio.materiales.find((m) => m.id === id)?.nombre ?? id;

export default function Pedido() {
  const carrito = useStore($carrito);
  const medidas = useStore($medidas);
  const [numero, setNumero] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    ciudad: '',
    celular: '',
    nota: '',
  });
  const [confirmado, setConfirmado] = useState<{
    numero: string;
    mensaje: string;
    url: string | null;
  } | null>(null);
  const [miniaturasPerdidas, setMiniaturasPerdidas] = useState(false);

  useEffect(() => {
    obtenerAlmacen()
      .listar()
      .then((pedidos) => setNumero(siguienteNumero(pedidos, negocio.marca.prefijoPedido)));
  }, []);

  useEffect(() => {
    setMiniaturasPerdidas(carrito.some((i) => !leerMiniatura(i.id)));
  }, [carrito]);

  const desglose = useMemo(
    () => calcularDesglose(carrito, medidas, negocio.pagos.porcentajeAbono),
    [carrito, medidas],
  );

  const mensaje = useMemo(
    () =>
      construirMensaje({
        numero: numero ?? '…',
        items: carrito,
        desglose,
        cliente: {
          nombre: cliente.nombre.trim() || '(tu nombre)',
          ciudad: cliente.ciudad.trim() || '(tu ciudad)',
          celular: cliente.celular?.trim(),
          nota: cliente.nota?.trim(),
        },
        negocio: { ...negocio, medidas },
      }),
    [numero, carrito, desglose, cliente, medidas],
  );

  const demo = esModoDemo(negocio.whatsapp.numero);

  async function pedir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!numero || carrito.length === 0) return;
    // WhatsApp se abre dentro del mismo toque: si se abre después de un await, Safari iOS y el
    // navegador de Instagram pueden bloquear la ventana.
    const url = urlWhatsApp(negocio.whatsapp.numero, mensaje);
    if (url) window.open(url, '_blank', 'noopener');
    const pedido = crearPedido({
      numero,
      cliente: {
        nombre: cliente.nombre.trim(),
        ciudad: cliente.ciudad.trim(),
        celular: cliente.celular?.trim(),
        ...(cliente.nota?.trim() ? { nota: cliente.nota.trim() } : {}),
      },
      items: carrito.map(
        ({ medidaId, orientacion, material, cantidad, archivo, calidad, dpi }) => ({
          medidaId,
          orientacion,
          material,
          cantidad,
          archivo,
          calidad,
          dpi,
        }),
      ),
      total: desglose.total,
      fecha: new Date().toISOString(),
    });
    await obtenerAlmacen().guardar(pedido);

    for (const item of carrito) borrarMiniatura(item.id);
    vaciarCarrito();
    setConfirmado({ numero, mensaje, url });
  }

  if (confirmado) {
    return (
      <div className="flex flex-col gap-6" role="status">
        <div className="rounded-lg border border-dorado/50 bg-dorado/10 p-5">
          <h2 className="font-serif text-3xl font-semibold text-dorado">
            Tu pedido {confirmado.numero} quedó registrado
          </h2>
          <p className="mt-2">
            {demo
              ? `${AVISO_DEMO} Aquí puedes ver el mensaje que le llegaría.`
              : 'Abrimos WhatsApp con tu pedido. Envía el mensaje y adjunta tus fotos en el chat.'}
          </p>
          {confirmado.url && (
            <a
              href={confirmado.url}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex min-h-11 items-center text-dorado underline underline-offset-4"
            >
              ¿No se abrió? Abrir WhatsApp
            </a>
          )}
          <a
            href={`/seguimiento?numero=${encodeURIComponent(confirmado.numero)}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-dorado px-6 font-medium text-fondo hover:bg-dorado-oscuro"
          >
            Ver el seguimiento
          </a>
          <p className="mt-3 text-sm text-texto-suave">
            En esta demo el pedido se guarda en este navegador: solo lo verás aquí.
          </p>
        </div>
        <VistaMensaje mensaje={confirmado.mensaje} />
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 p-6 text-center">
        <p>Tu pedido está vacío.</p>
        <a
          href="/crear"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-dorado px-6 font-medium text-fondo hover:bg-dorado-oscuro"
        >
          Crear mi cuadro
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="cuadros">
          <h2 id="cuadros" className="mb-3 font-serif text-2xl font-semibold text-dorado">
            Tus cuadros
          </h2>
          {miniaturasPerdidas && (
            <p className="mb-3 rounded-lg border border-amber-300/50 bg-amber-300/10 p-3 text-sm">
              Algunas vistas previas se perdieron al cerrar la pestaña. Tu pedido sigue igual:
              adjunta esas fotos en el chat de WhatsApp.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {carrito.map((item) => {
              const medida = medidas.find((m) => m.id === item.medidaId);
              const etiqueta = medida ? etiquetaMedida(medida, item.orientacion) : item.medidaId;
              return (
                <li key={item.id} className="flex gap-3 rounded-lg border border-white/10 p-3">
                  <Miniatura item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {etiqueta} · {item.orientacion} · {nombreMaterial(item.material)}
                    </p>
                    <p className="truncate text-sm text-texto-suave">
                      {item.archivo} · calidad {item.calidad}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${etiqueta}`}
                        onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                        className="size-11 rounded-lg border border-white/15 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">
                        <span className="sr-only">Cantidad: </span>
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        aria-label={`Agregar uno de ${etiqueta}`}
                        onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                        className="size-11 rounded-lg border border-white/15"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          borrarMiniatura(item.id);
                          quitarDelCarrito(item.id);
                        }}
                        className="ml-auto min-h-11 px-2 text-sm text-texto-suave underline underline-offset-4 hover:text-texto"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <a
            href="/crear"
            className="mt-3 inline-flex min-h-11 items-center text-dorado underline underline-offset-4"
          >
            Agregar otro cuadro
          </a>
        </section>

        <section
          aria-labelledby="desglose"
          className="rounded-lg border border-white/10 bg-superficie p-4"
        >
          <h2 id="desglose" className="mb-3 font-serif text-2xl font-semibold text-dorado">
            Desglose
          </h2>
          <div className="flex flex-col gap-1">
            {desglose.lineas.map((l) => {
              const medida = medidas.find((m) => m.id === l.medidaId);
              const promo = medida ? sugerenciaPromocion(medida, l.cantidad) : null;
              return (
                <div key={l.medidaId} className="border-b border-white/10 pb-2">
                  <div className="flex justify-between gap-4">
                    <span>
                      {l.medidaId.replace('x', '×')} × {l.cantidad}
                    </span>
                    <span>{formatearPesos(l.subtotal)}</span>
                  </div>
                  {l.descuento > 0 && (
                    <div className="flex justify-between gap-4 text-emerald-300">
                      <span>Descuento {l.medidaId.replace('x', '×')}</span>
                      <span>−{formatearPesos(l.descuento)}</span>
                    </div>
                  )}
                  {promo && <p className="text-sm text-dorado">{promo.mensaje}</p>}
                </div>
              );
            })}
            <div className="flex justify-between gap-4 pt-1">
              <span>Subtotal sin promoción</span>
              <span>{formatearPesos(desglose.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Descuento</span>
              <span>−{formatearPesos(desglose.descuento)}</span>
            </div>
            <div className="flex justify-between gap-4 text-lg font-semibold">
              <span>Total</span>
              <span data-testid="total">{formatearPesos(desglose.total)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Abono ({negocio.pagos.porcentajeAbono}%) para empezar</span>
              <span data-testid="abono">{formatearPesos(desglose.abono)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Saldo antes del envío</span>
              <span>{formatearPesos(desglose.saldo)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm text-texto-suave">
              <span>Envío</span>
              <span className="text-right">{negocio.envio.texto}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <form onSubmit={pedir} className="flex flex-col gap-4" aria-labelledby="tus-datos">
          <h2 id="tus-datos" className="font-serif text-2xl font-semibold text-dorado">
            Tus datos
          </h2>
          {(
            [
              ['nombre', 'Nombre', 'name', true],
              ['ciudad', 'Ciudad', 'address-level2', true],
              ['celular', 'Celular', 'tel', true],
            ] as const
          ).map(([campo, etiqueta, autocompletar, requerido]) => (
            <label key={campo} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-texto-suave">{etiqueta}</span>
              <input
                name={campo}
                required={requerido}
                autoComplete={autocompletar}
                type={campo === 'celular' ? 'tel' : 'text'}
                inputMode={campo === 'celular' ? 'tel' : undefined}
                pattern={campo === 'celular' ? '[0-9 +]{7,15}' : undefined}
                maxLength={campo === 'celular' ? 15 : 80}
                value={cliente[campo] ?? ''}
                onChange={(e) => setCliente({ ...cliente, [campo]: e.target.value })}
                className="h-11 rounded-lg border border-white/15 bg-transparent px-3"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-texto-suave">
              Nota para el taller (opcional)
            </span>
            <textarea
              name="nota"
              rows={3}
              maxLength={200}
              value={cliente.nota ?? ''}
              onChange={(e) => setCliente({ ...cliente, nota: e.target.value })}
              className="rounded-lg border border-white/15 bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={!numero}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-dorado px-6 font-medium text-fondo hover:bg-dorado-oscuro disabled:opacity-50"
          >
            Pedir por WhatsApp
          </button>
          {demo && <p className="text-sm text-texto-suave">Modo demo: {AVISO_DEMO}</p>}
        </form>

        <VistaMensaje mensaje={mensaje} />
      </div>
    </div>
  );
}

function VistaMensaje({ mensaje }: { mensaje: string }) {
  return (
    <section aria-labelledby="mensaje">
      <h2 id="mensaje" className="mb-2 font-serif text-2xl font-semibold text-dorado">
        Mensaje para el taller
      </h2>
      <pre
        data-testid="mensaje"
        className="rounded-lg border border-white/10 bg-[#0b141a] p-4 font-sans text-sm whitespace-pre-wrap text-[#e9edef]"
      >
        {mensaje}
      </pre>
      <p className="mt-1 text-right text-xs text-texto-suave">{mensaje.length} caracteres</p>
    </section>
  );
}
