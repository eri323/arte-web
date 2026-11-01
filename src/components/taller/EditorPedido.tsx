import { useState, type FormEvent } from 'react';
import { negocio } from '../../config/negocio';
import { formatearFecha, formatearPesos } from '../../lib/formato';
import {
  agregarNota,
  calcularAbono,
  ETIQUETAS_ESTADO,
  fijarEnvio,
  fijarFechaEstimada,
  puedeTransicionar,
  registrarPago,
  saldoPendiente,
  siguienteEstado,
  totalPagado,
  transicionar,
  type Pedido,
} from '../../lib/pedidos';

interface Props {
  pedido: Pedido;
  onGuardar: (pedido: Pedido) => Promise<void>;
}

const porcentaje = negocio.pagos.porcentajeAbono;
const ahora = () => new Date().toISOString();
const campo = 'h-11 rounded-lg border border-linea-fuerte bg-transparent px-3';
const botonSecundario =
  'inline-flex min-h-11 items-center justify-center rounded-sm border border-acento/60 px-5 font-medium hover:border-acento disabled:opacity-50';

export default function EditorPedido({ pedido, onGuardar }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [notaPago, setNotaPago] = useState('');
  const [nota, setNota] = useState('');
  const [transportadora, setTransportadora] = useState(pedido.envio?.transportadora ?? '');
  const [guia, setGuia] = useState(pedido.envio?.guia ?? '');

  const siguiente = siguienteEstado(pedido.estado);
  const saldo = saldoPendiente(pedido);
  const faltaAbono = Math.max(0, calcularAbono(pedido.total, porcentaje) - totalPagado(pedido));

  async function aplicar(cambio: () => Pedido) {
    try {
      setError(null);
      await onGuardar(cambio());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      return false;
    }
  }

  // Un toque: si el siguiente estado exige un pago, se registra el que falta antes de avanzar.
  function avanzar() {
    if (!siguiente) return;
    void aplicar(() => {
      let p = pedido;
      if (siguiente === 'abono_confirmado' && faltaAbono > 0) {
        p = registrarPago(p, { monto: faltaAbono, fecha: ahora(), nota: 'Abono' });
      }
      if (siguiente === 'saldo_pagado' && saldo > 0) {
        p = registrarPago(p, { monto: saldo, fecha: ahora(), nota: 'Saldo' });
      }
      if (siguiente === 'enviado' && !p.envio) p = fijarEnvio(p, { transportadora, guia });
      return transicionar(p, siguiente, ahora(), porcentaje);
    });
  }

  let textoAvance = siguiente ? `Pasar a: ${ETIQUETAS_ESTADO[siguiente]}` : '';
  if (siguiente === 'abono_confirmado' && faltaAbono > 0) {
    textoAvance = `Confirmar abono de ${formatearPesos(faltaAbono)}`;
  } else if (siguiente === 'saldo_pagado' && saldo > 0) {
    textoAvance = `Registrar saldo de ${formatearPesos(saldo)} y marcar pagado`;
  }
  const bloqueoEnvio =
    siguiente === 'enviado' && !pedido.envio && (!transportadora.trim() || !guia.trim());
  const motivo =
    siguiente &&
    !bloqueoEnvio &&
    siguiente !== 'abono_confirmado' &&
    siguiente !== 'enviado' &&
    siguiente !== 'saldo_pagado'
      ? puedeTransicionar(pedido, siguiente, porcentaje)
      : null;

  async function pagar(e: FormEvent) {
    e.preventDefault();
    if (
      await aplicar(() =>
        registrarPago(pedido, { monto: Number(monto), fecha: ahora(), nota: notaPago }),
      )
    ) {
      setMonto('');
      setNotaPago('');
    }
  }

  async function anotar(e: FormEvent) {
    e.preventDefault();
    if (await aplicar(() => agregarNota(pedido, nota, ahora()))) setNota('');
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-acento/40 bg-superficie p-5">
      <div>
        <h3 className="font-display text-2xl font-semibold text-acento-fuerte">
          Pedido {pedido.numero}
        </h3>
        <p className="text-texto-suave">
          {pedido.cliente.nombre} · {pedido.cliente.ciudad}
          {pedido.cliente.celular && ` · ${pedido.cliente.celular}`}
        </p>
        <p className="mt-1">
          Estado: <strong>{ETIQUETAS_ESTADO[pedido.estado]}</strong> · Total{' '}
          {formatearPesos(pedido.total)} · Saldo {formatearPesos(saldo)}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-700/50 bg-red-600/10 p-3">
          {error}
        </p>
      )}

      {siguiente ? (
        <div className="flex flex-col gap-3">
          {siguiente === 'enviado' && !pedido.envio && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-texto-suave">Transportadora</span>
                <input
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  className={campo}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-texto-suave">Número de guía</span>
                <input value={guia} onChange={(e) => setGuia(e.target.value)} className={campo} />
              </label>
            </div>
          )}
          <button
            type="button"
            onClick={avanzar}
            disabled={bloqueoEnvio || (motivo !== null && !motivo.ok)}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-acento px-6 font-medium text-fondo hover:bg-acento-fuerte disabled:opacity-50"
          >
            {textoAvance}
          </button>
          {motivo && !motivo.ok && <p className="text-sm text-texto-suave">{motivo.motivo}</p>}
        </div>
      ) : (
        <p className="text-texto-suave">Pedido entregado. No hay más estados.</p>
      )}

      <form onSubmit={anotar} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Nota para el cliente</span>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            maxLength={300}
            className="rounded-lg border border-linea-fuerte bg-transparent px-3 py-2"
          />
        </label>
        <button type="submit" className={botonSecundario} disabled={!nota.trim()}>
          Agregar nota
        </button>
      </form>

      <form onSubmit={pagar} className="flex flex-col gap-2">
        <span className="text-sm font-medium text-texto-suave">Registrar pago</span>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-texto-suave">Monto (pesos)</span>
            <input
              type="number"
              min={1}
              step={1}
              max={saldo}
              inputMode="numeric"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={campo}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-texto-suave">Nota del pago</span>
            <input
              value={notaPago}
              onChange={(e) => setNotaPago(e.target.value)}
              className={campo}
            />
          </label>
        </div>
        <button type="submit" className={botonSecundario} disabled={!monto || saldo === 0}>
          Registrar pago
        </button>
      </form>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-suave">Fecha estimada de entrega</span>
        <input
          type="date"
          value={pedido.fechaEstimada ?? ''}
          onChange={(e) =>
            void aplicar(() => fijarFechaEstimada(pedido, e.target.value || undefined))
          }
          className={campo}
        />
      </label>

      {pedido.notas.length > 0 && (
        <div>
          <p className="text-sm font-medium text-texto-suave">Notas enviadas</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {pedido.notas.map((n, i) => (
              <li key={i}>
                {formatearFecha(n.fecha)}: {n.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
