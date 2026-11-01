import { describe, expect, it } from 'vitest';
import {
  agregarNota,
  calcularAbono,
  calcularSaldo,
  crearPedido,
  ESTADOS,
  fijarEnvio,
  fijarFechaEstimada,
  puedeTransicionar,
  registrarPago,
  saldoPendiente,
  siguienteEstado,
  siguienteNumero,
  totalPagado,
  transicionar,
  type Pedido,
} from './pedidos';

const FECHA = '2026-11-01T12:00:00.000Z';

function pedidoBase(total = 120000): Pedido {
  return crearPedido({
    numero: 'AE-1043',
    cliente: { nombre: 'Ana', ciudad: 'Pereira' },
    items: [
      {
        medidaId: '30x40',
        orientacion: 'vertical',
        material: 'mdf',
        cantidad: 2,
        archivo: 'foto.jpg',
        calidad: 'buena',
        dpi: 256,
      },
    ],
    total,
    fecha: FECHA,
  });
}

describe('abono y saldo', () => {
  it.each([
    [120000, 60000, 60000],
    [210000, 105000, 105000],
    [30001, 15001, 15000],
    [1, 1, 0],
    [0, 0, 0],
  ])('total %i → abono %i, saldo %i', (total, abono, saldo) => {
    expect(calcularAbono(total, 50)).toBe(abono);
    expect(calcularSaldo(total, 50)).toBe(saldo);
  });

  it('rechaza totales con decimales o negativos', () => {
    expect(() => calcularAbono(10.5, 50)).toThrow();
    expect(() => calcularAbono(-1, 50)).toThrow();
  });
});

describe('crearPedido', () => {
  it('arranca en recibido con historial y sin pagos', () => {
    const p = pedidoBase();
    expect(p.estado).toBe('recibido');
    expect(p.historial).toEqual([{ estado: 'recibido', fecha: FECHA }]);
    expect(p.pagos).toEqual([]);
    expect(p.notas).toEqual([]);
    expect(saldoPendiente(p)).toBe(120000);
  });
});

describe('transiciones', () => {
  it('los estados van en el orden de la sección 7', () => {
    expect(ESTADOS).toEqual([
      'recibido',
      'abono_confirmado',
      'en_produccion',
      'listo',
      'saldo_pagado',
      'enviado',
      'entregado',
    ]);
    expect(siguienteEstado('listo')).toBe('saldo_pagado');
    expect(siguienteEstado('entregado')).toBeNull();
  });

  it('no deja saltar estados ni retroceder', () => {
    const p = pedidoBase();
    expect(puedeTransicionar(p, 'en_produccion', 50).ok).toBe(false);
    expect(puedeTransicionar(p, 'recibido', 50).ok).toBe(false);
  });

  it('pide el abono pagado para confirmar el abono', () => {
    const p = pedidoBase();
    expect(puedeTransicionar(p, 'abono_confirmado', 50)).toEqual({
      ok: false,
      motivo: 'Falta registrar el abono del 50%.',
    });
    const conAbono = registrarPago(p, { monto: 60000, fecha: FECHA, nota: 'Nequi' });
    expect(puedeTransicionar(conAbono, 'abono_confirmado', 50)).toEqual({ ok: true });
  });

  it('recorre todo el flujo válido', () => {
    let p = registrarPago(pedidoBase(), { monto: 60000, fecha: FECHA, nota: 'Abono' });
    p = transicionar(p, 'abono_confirmado', FECHA, 50);
    p = transicionar(p, 'en_produccion', FECHA, 50);
    p = transicionar(p, 'listo', FECHA, 50);
    expect(() => transicionar(p, 'saldo_pagado', FECHA, 50)).toThrow('Falta pagar el saldo.');
    p = registrarPago(p, { monto: 60000, fecha: FECHA, nota: 'Saldo' });
    p = transicionar(p, 'saldo_pagado', FECHA, 50);
    expect(() => transicionar(p, 'enviado', FECHA, 50)).toThrow(
      'Falta la transportadora y el número de guía.',
    );
    p = fijarEnvio(p, { transportadora: 'Envíos Demo', guia: '123' });
    p = transicionar(p, 'enviado', FECHA, 50);
    p = transicionar(p, 'entregado', FECHA, 50);
    expect(p.estado).toBe('entregado');
    expect(p.historial.map((h) => h.estado)).toEqual(ESTADOS);
  });

  it('no muta el pedido original', () => {
    const p = registrarPago(pedidoBase(), { monto: 60000, fecha: FECHA, nota: '' });
    transicionar(p, 'abono_confirmado', FECHA, 50);
    expect(p.estado).toBe('recibido');
  });
});

describe('pagos', () => {
  it('suma pagos y calcula el saldo pendiente', () => {
    const p = registrarPago(pedidoBase(), { monto: 50000, fecha: FECHA, nota: '' });
    expect(totalPagado(p)).toBe(50000);
    expect(saldoPendiente(p)).toBe(70000);
  });

  it.each([0, -5, 10.5])('rechaza un pago de %s', (monto) => {
    expect(() => registrarPago(pedidoBase(), { monto, fecha: FECHA, nota: '' })).toThrow();
  });

  it('rechaza pagar más que el saldo', () => {
    expect(() => registrarPago(pedidoBase(), { monto: 120001, fecha: FECHA, nota: '' })).toThrow();
  });
});

describe('notas, fecha estimada y envío', () => {
  it('agrega notas recortando espacios y rechaza vacías', () => {
    const p = agregarNota(pedidoBase(), '  Tu cuadro entra a impresión mañana ', FECHA);
    expect(p.notas).toEqual([{ fecha: FECHA, texto: 'Tu cuadro entra a impresión mañana' }]);
    expect(() => agregarNota(p, '   ', FECHA)).toThrow();
  });

  it('fija y quita la fecha estimada', () => {
    const p = fijarFechaEstimada(pedidoBase(), '2026-11-10');
    expect(p.fechaEstimada).toBe('2026-11-10');
    expect(fijarFechaEstimada(p, undefined).fechaEstimada).toBeUndefined();
  });

  it('exige transportadora y guía', () => {
    expect(() => fijarEnvio(pedidoBase(), { transportadora: ' ', guia: '1' })).toThrow();
  });
});

describe('siguienteNumero', () => {
  it('empieza en 1043 y sigue el mayor', () => {
    expect(siguienteNumero([], 'AE')).toBe('AE-1043');
    expect(siguienteNumero([{ numero: 'AE-1042' }, { numero: 'AE-1040' }], 'AE')).toBe('AE-1043');
    expect(siguienteNumero([{ numero: 'AE-1050' }, { numero: 'XX-9999' }], 'AE')).toBe('AE-1051');
  });
});
