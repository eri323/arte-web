import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { crearPedidosDemo } from './datos-demo';
import { saldoPendiente } from './pedidos';
import { calcularDesglose } from './precios';

const AHORA = new Date('2026-11-01T12:00:00.000Z');
const demo = crearPedidosDemo(AHORA);
const porNumero = (n: string) => {
  const p = demo.find((x) => x.numero === n);
  if (!p) throw new Error(n);
  return p;
};

describe('crearPedidosDemo', () => {
  it('trae los 3 pedidos de la sección 7', () => {
    expect(demo.map((p) => [p.numero, p.estado])).toEqual([
      ['MA-1040', 'en_produccion'],
      ['MA-1041', 'listo'],
      ['MA-1042', 'enviado'],
    ]);
  });

  it('MA-1040 tiene la nota de impresión', () => {
    expect(porNumero('MA-1040').notas.map((n) => n.texto)).toContain(
      'Tu cuadro entra a impresión mañana',
    );
  });

  it('MA-1041 tiene saldo pendiente', () => {
    expect(saldoPendiente(porNumero('MA-1041'))).toBeGreaterThan(0);
  });

  it('MA-1042 tiene guía y está pagado', () => {
    const p = porNumero('MA-1042');
    expect(p.envio?.guia).toBeTruthy();
    expect(saldoPendiente(p)).toBe(0);
  });

  it('los totales salen de las reglas de precios', () => {
    for (const p of demo) {
      expect(p.total).toBe(calcularDesglose(p.items, negocio.medidas, 50).total);
    }
  });

  it('las fechas son relativas a ahora', () => {
    for (const p of demo) {
      for (const h of p.historial)
        expect(new Date(h.fecha).getTime()).toBeLessThanOrEqual(AHORA.getTime());
      expect(p.historial.map((h) => h.estado).at(-1)).toBe(p.estado);
    }
    expect(new Date(porNumero('MA-1040').fechaEstimada ?? 0).getTime()).toBeGreaterThan(
      AHORA.getTime(),
    );
    const otraFecha = crearPedidosDemo(new Date('2027-03-01T12:00:00.000Z'));
    expect(otraFecha[0].historial[0].fecha.startsWith('2027-02')).toBe(true);
  });
});
