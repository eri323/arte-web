import { useEffect, useState, type FormEvent } from 'react';
import { negocio } from '../../config/negocio';
import { obtenerAlmacen } from '../../lib/almacen';
import { formatearFecha, formatearPesos } from '../../lib/formato';
import {
  ESTADOS,
  ETIQUETAS_ESTADO,
  saldoPendiente,
  totalPagado,
  type Pedido,
} from '../../lib/pedidos';

type Resultado = { tipo: 'encontrado'; pedido: Pedido } | { tipo: 'no-encontrado'; numero: string };

function LineaEstados({ pedido }: { pedido: Pedido }) {
  const actual = ESTADOS.indexOf(pedido.estado);
  return (
    <ol className="flex flex-col gap-0">
      {ESTADOS.map((estado, i) => {
        const fecha = pedido.historial.find((h) => h.estado === estado)?.fecha;
        const hecho = i <= actual;
        return (
          <li
            key={estado}
            aria-current={i === actual ? 'step' : undefined}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            <span
              aria-hidden="true"
              className={`mt-1 size-4 shrink-0 rounded-full border-2 ${
                i === actual
                  ? 'border-acento bg-acento'
                  : hecho
                    ? 'border-acento bg-acento/40'
                    : 'border-linea-fuerte'
              }`}
            />
            <span className={hecho ? '' : 'text-texto-suave'}>
              <span className={i === actual ? 'font-semibold text-acento-fuerte' : ''}>
                {ETIQUETAS_ESTADO[estado]}
              </span>
              {i === actual && <span className="sr-only"> (estado actual)</span>}
              {fecha && (
                <span className="block text-sm text-texto-suave">{formatearFecha(fecha)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DetallePedido({ pedido }: { pedido: Pedido }) {
  const pagado = totalPagado(pedido);
  const saldo = saldoPendiente(pedido);
  return (
    <article aria-labelledby="titulo-pedido" className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-linea bg-superficie p-5">
        <h2 id="titulo-pedido" className="font-display text-3xl font-semibold text-acento-fuerte">
          Pedido {pedido.numero}
        </h2>
        <p className="text-texto-suave">
          {pedido.cliente.nombre} · {pedido.cliente.ciudad}
        </p>
        {pedido.fechaEstimada && (
          <p className="mt-2">
            Fecha estimada: <strong>{formatearFecha(pedido.fechaEstimada)}</strong>
          </p>
        )}
        <h3 className="mt-5 mb-3 font-medium">Estado</h3>
        <LineaEstados pedido={pedido} />
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-linea p-5" aria-labelledby="pagos">
          <h3 id="pagos" className="mb-3 font-display text-2xl font-semibold text-acento-fuerte">
            Pagos
          </h3>
          {pedido.pagos.length === 0 ? (
            <p className="text-texto-suave">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {pedido.pagos.map((p, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {formatearFecha(p.fecha)}
                    {p.nota && <span className="text-texto-suave"> · {p.nota}</span>}
                  </span>
                  <span>{formatearPesos(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-col gap-1 border-t border-linea pt-3">
            <p className="flex justify-between">
              <span>Total</span>
              <span>{formatearPesos(pedido.total)}</span>
            </p>
            <p className="flex justify-between">
              <span>Pagado</span>
              <span>{formatearPesos(pagado)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>Saldo pendiente</span>
              <span data-testid="saldo">{formatearPesos(saldo)}</span>
            </p>
          </div>
        </section>

        {pedido.envio && (
          <section className="rounded-lg border border-linea p-5" aria-labelledby="envio">
            <h3 id="envio" className="mb-2 font-display text-2xl font-semibold text-acento-fuerte">
              Envío
            </h3>
            <p>Transportadora: {pedido.envio.transportadora}</p>
            <p>
              Guía: <strong>{pedido.envio.guia}</strong>
            </p>
          </section>
        )}

        <section className="rounded-lg border border-linea p-5" aria-labelledby="notas">
          <h3 id="notas" className="mb-2 font-display text-2xl font-semibold text-acento-fuerte">
            Notas del taller
          </h3>
          {pedido.notas.length === 0 ? (
            <p className="text-texto-suave">Sin notas por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...pedido.notas].reverse().map((n, i) => (
                <li key={i}>
                  <p>{n.texto}</p>
                  <p className="text-sm text-texto-suave">{formatearFecha(n.fecha)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}

export default function Seguimiento() {
  const [numero, setNumero] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function buscar(texto: string) {
    const limpio = texto.trim().toUpperCase();
    if (!limpio) return;
    const pedido = await obtenerAlmacen().obtener(limpio);
    setResultado(
      pedido ? { tipo: 'encontrado', pedido } : { tipo: 'no-encontrado', numero: limpio },
    );
    const url = new URL(window.location.href);
    url.searchParams.set('numero', limpio);
    window.history.replaceState(null, '', url);
  }

  useEffect(() => {
    const inicial = new URLSearchParams(window.location.search).get('numero');
    if (inicial) {
      setNumero(inicial);
      void buscar(inicial);
    }
  }, []);

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    void buscar(numero);
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={alEnviar} className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Número de pedido</span>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder={`${negocio.marca.prefijoPedido}-1041`}
            required
            autoCapitalize="characters"
            className="h-11 rounded-lg border border-linea-fuerte bg-transparent px-3 uppercase placeholder:normal-case"
          />
        </label>
        <button type="submit" className="boton boton-oro">
          Buscar
        </button>
      </form>

      <div aria-live="polite">
        {resultado?.tipo === 'no-encontrado' && (
          <p className="rounded-lg border border-amber-600/50 bg-amber-400/15 p-4">
            No encontramos el pedido {resultado.numero}. Revisa el número que te llegó por WhatsApp.
            En esta demo los pedidos se guardan en este navegador.
          </p>
        )}
        {resultado?.tipo === 'encontrado' && <DetallePedido pedido={resultado.pedido} />}
      </div>

      {!resultado && (
        <p className="text-sm text-texto-suave">
          Prueba con los pedidos de ejemplo: {negocio.marca.prefijoPedido}-1040,{' '}
          {negocio.marca.prefijoPedido}-1041 o {negocio.marca.prefijoPedido}-1042.
        </p>
      )}
    </div>
  );
}
