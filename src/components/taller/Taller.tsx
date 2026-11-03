import { useCallback, useEffect, useState } from 'react';
import { obtenerAlmacen } from '../../lib/almacen';
import { formatearPesos } from '../../lib/formato';
import { ETIQUETAS_ESTADO, saldoPendiente, type Pedido } from '../../lib/pedidos';
import { restaurarPrecios } from '../../stores/precios';
import { restaurarColores } from '../../stores/marca';
import EditorColores from './EditorColores';
import EditorPedido from './EditorPedido';
import EditorPrecios from './EditorPrecios';

export default function Taller() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);
  const [preciosVersion, setPreciosVersion] = useState(0);

  const recargar = useCallback(async () => {
    setPedidos(await obtenerAlmacen().listar());
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  async function guardar(pedido: Pedido) {
    await obtenerAlmacen().guardar(pedido);
    await recargar();
  }

  async function restaurar() {
    if (!confirmarRestaurar) {
      setConfirmarRestaurar(true);
      return;
    }
    await obtenerAlmacen().restaurarDemo();
    restaurarPrecios();
    restaurarColores();
    setPreciosVersion((v) => v + 1);
    setSeleccionado(null);
    setConfirmarRestaurar(false);
    await recargar();
  }

  const actual = pedidos?.find((p) => p.numero === seleccionado) ?? null;

  return (
    <div className="flex flex-col gap-10">
      <p role="note" className="rounded-lg border border-amber-600/50 bg-amber-400/15 p-4">
        <strong>Panel demo sin login.</strong> En la versión real solo entra el taller con su
        usuario. Los cambios se guardan en este navegador.
      </p>

      <section
        aria-labelledby="pedidos"
        className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      >
        <div>
          <h2 id="pedidos" className="mb-3 font-display text-3xl">
            Pedidos
          </h2>
          {pedidos === null ? (
            <p className="text-texto-suave">Cargando…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pedidos.map((p) => (
                <li key={p.numero}>
                  <button
                    type="button"
                    onClick={() => setSeleccionado(p.numero)}
                    aria-pressed={p.numero === seleccionado}
                    className="flex min-h-11 w-full flex-col rounded-lg border border-linea p-3 text-left hover:border-acento/60 aria-pressed:border-acento aria-pressed:bg-acento/10"
                  >
                    <span className="flex w-full justify-between gap-2">
                      <span className="font-semibold">{p.numero}</span>
                      <span className="text-sm text-texto-suave">{ETIQUETAS_ESTADO[p.estado]}</span>
                    </span>
                    <span className="text-sm text-texto-suave">
                      {p.cliente.nombre} · {formatearPesos(p.total)} · saldo{' '}
                      {formatearPesos(saldoPendiente(p))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={restaurar}
            onBlur={() => setConfirmarRestaurar(false)}
            className="mt-4 inline-flex min-h-11 items-center rounded-sm border border-red-700/50 px-5 text-sm hover:border-red-700"
          >
            {confirmarRestaurar ? 'Toca otra vez para confirmar' : 'Restaurar datos de ejemplo'}
          </button>
          <p className="mt-1 text-xs text-texto-suave">
            Vuelve a los 3 pedidos de ejemplo y a los precios y colores de negocio.ts.
          </p>
        </div>
        <div>
          {actual ? (
            <EditorPedido
              key={`${actual.numero}-${actual.historial.length}`}
              pedido={actual}
              onGuardar={guardar}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-linea-fuerte p-6 text-texto-suave">
              Elige un pedido para cambiar su estado, registrar pagos o dejar una nota.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="precios">
        <h2 id="precios" className="mb-1 font-display text-3xl">
          Precios y promociones
        </h2>
        <p className="mb-4 text-texto-suave">
          Los cambios se ven al instante en /formatos, el configurador y el pedido.
        </p>
        <EditorPrecios key={preciosVersion} />
      </section>

      <section aria-labelledby="colores-titulo" id="colores" className="scroll-mt-6">
        <h2 id="colores-titulo" className="mb-1 font-display text-3xl">
          Colores de la marca
        </h2>
        <p className="mb-4 text-texto-suave">
          Elige una paleta o tus propios colores: todo el sitio cambia al instante.
        </p>
        <EditorColores key={preciosVersion} />
      </section>
    </div>
  );
}
