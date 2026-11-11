import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { negocio } from '../../config/negocio';
import Poster from '../catalogo/Poster';
import { obtenerAlmacen } from '../../lib/almacen';
import { etiquetaMedida, etiquetaMedidaLarga, formatearPesos } from '../../lib/formato';
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
import { $medidas } from '../../stores/precios';

const AVISO_DEMO = 'En la versión real esto abre el WhatsApp del taller.';

function Miniatura({ item }: { item: ItemCarrito }) {
  if (item.disenoId) {
    const diseno = negocio.catalogo.find((d) => d.id === item.disenoId);
    return (
      <div className="flex w-20 shrink-0 items-start">
        {diseno && <Poster diseno={diseno} decorativa className="w-full" />}
      </div>
    );
  }
  // Un personalizado todavía no existe: se muestra el marco con el nombre del vehículo.
  return (
    <div className="w-20 shrink-0">
      <span className="marco sombra-cuadro w-full" style={{ aspectRatio: '5 / 7' }}>
        <span className="grid size-full place-items-center bg-[#f7f7f5] p-1 text-center font-display text-[0.8125rem] leading-none text-[#0e0e10]">
          {item.archivo}
        </span>
      </span>
    </div>
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

  useEffect(() => {
    obtenerAlmacen()
      .listar()
      .then((pedidos) => setNumero(siguienteNumero(pedidos, negocio.marca.prefijoPedido)));
  }, []);

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
        ({
          medidaId,
          orientacion,
          material,
          cantidad,
          archivo,
          calidad,
          dpi,
          disenoId,
          encargo,
        }) => ({
          medidaId,
          orientacion,
          material,
          cantidad,
          archivo,
          calidad,
          dpi,
          ...(disenoId ? { disenoId } : {}),
          ...(encargo ? { encargo } : {}),
        }),
      ),
      total: desglose.total,
      fecha: new Date().toISOString(),
    });
    await obtenerAlmacen().guardar(pedido);

    vaciarCarrito();
    setConfirmado({ numero, mensaje, url });
  }

  if (confirmado) {
    return (
      <div className="flex flex-col gap-6" role="status">
        <div className="rounded-lg border border-acento/50 bg-acento/10 p-5">
          <h2 className="font-display text-3xl">Tu pedido {confirmado.numero} quedó registrado</h2>
          <p className="mt-2">
            {demo
              ? `${AVISO_DEMO} Aquí puedes ver el mensaje que le llegaría.`
              : 'Abrimos WhatsApp con tu pedido. Envía el mensaje y, si pediste un personalizado, adjunta las fotos de tu vehículo en el chat.'}
          </p>
          {confirmado.url && (
            <a
              href={confirmado.url}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex min-h-11 items-center text-acento-fuerte underline underline-offset-4"
            >
              ¿No se abrió? Abrir WhatsApp
            </a>
          )}
          <a
            href={`/seguimiento?numero=${encodeURIComponent(confirmado.numero)}`}
            className="mt-4 inline-flex min-h-11 items-center boton boton-negro"
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
      <div className="rounded-lg border border-linea p-6 text-center">
        <p>Tu pedido está vacío.</p>
        <a href="/#catalogo" className="mt-4 inline-flex min-h-11 items-center boton boton-negro">
          Ver el catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="cuadros">
          <h2 id="cuadros" className="mb-3 font-display text-2xl">
            Tus pósters
          </h2>
          <ul className="flex flex-col gap-3">
            {carrito.map((item) => {
              const medida = medidas.find((m) => m.id === item.medidaId);
              const etiqueta = medida
                ? etiquetaMedidaLarga(medida, item.orientacion)
                : item.medidaId;
              return (
                <li key={item.id} className="flex gap-3 rounded-lg border border-linea p-3">
                  <Miniatura item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.archivo}</p>
                    <p className="text-sm text-texto-suave">
                      {medida ? etiquetaMedida(medida, item.orientacion) : item.medidaId} cm
                      {item.encargo ? ', personalizado' : ''}, marco negro con{' '}
                      {nombreMaterial(item.material).toLowerCase()}
                    </p>
                    {item.encargo?.detalles && (
                      <p className="mt-1 line-clamp-2 text-sm text-texto-suave">
                        {item.encargo.detalles}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${etiqueta}`}
                        onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                        className="size-11 rounded-lg border border-linea-fuerte disabled:opacity-40"
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
                        className="size-11 rounded-lg border border-linea-fuerte"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarDelCarrito(item.id)}
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
            href="/#catalogo"
            className="mt-3 inline-flex min-h-11 items-center text-acento-fuerte underline underline-offset-4"
          >
            Agregar otro póster
          </a>
        </section>

        <section
          aria-labelledby="desglose"
          className="rounded-lg border border-linea bg-superficie p-4"
        >
          <h2 id="desglose" className="mb-3 font-display text-2xl">
            Desglose
          </h2>
          <div className="flex flex-col gap-1">
            {desglose.lineas.map((l) => {
              const medida = medidas.find((m) => m.id === l.medidaId);
              const promo = medida ? sugerenciaPromocion(medida, l.cantidad) : null;
              return (
                <div key={l.medidaId} className="border-b border-linea pb-2">
                  <div className="flex justify-between gap-4">
                    <span>
                      {medida ? etiquetaMedidaLarga(medida) : l.medidaId} × {l.cantidad}
                    </span>
                    <span>{formatearPesos(l.subtotal)}</span>
                  </div>
                  {l.descuento > 0 && (
                    <div className="flex justify-between gap-4 text-acento-fuerte">
                      <span>Descuento {medida ? etiquetaMedidaLarga(medida) : l.medidaId}</span>
                      <span>−{formatearPesos(l.descuento)}</span>
                    </div>
                  )}
                  {promo && <p className="text-sm text-acento-fuerte">{promo.mensaje}</p>}
                </div>
              );
            })}
            {desglose.descuento > 0 && (
              <>
                <div className="flex justify-between gap-4 pt-1">
                  <span>Subtotal sin promoción</span>
                  <span>{formatearPesos(desglose.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Descuento</span>
                  <span>−{formatearPesos(desglose.descuento)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 pt-1 text-lg font-semibold">
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
          <h2 id="tus-datos" className="font-display text-2xl">
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
                className="h-11 rounded-lg border border-linea-fuerte bg-transparent px-3"
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
              className="rounded-lg border border-linea-fuerte bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={!numero}
            className="inline-flex min-h-11 items-center justify-center boton boton-oro disabled:opacity-50"
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
      <h2 id="mensaje" className="mb-2 font-display text-2xl">
        Mensaje para el taller
      </h2>
      <pre
        data-testid="mensaje"
        className="rounded-lg border border-linea bg-[#0b141a] p-4 font-sans text-sm whitespace-pre-wrap text-[#e9edef]"
      >
        {mensaje}
      </pre>
      <p className="mt-1 text-right text-xs text-texto-suave">{mensaje.length} caracteres</p>
    </section>
  );
}
