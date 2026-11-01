import type { Pedido } from './pedidos';

// Pedidos de ejemplo para /seguimiento y /taller. Los nombres son genéricos y las fechas se
// calculan a partir de `ahora`, para que la demo no se vea vieja.

const DIA_MS = 24 * 60 * 60 * 1000;

function haceDias(ahora: Date, dias: number): string {
  return new Date(ahora.getTime() - dias * DIA_MS).toISOString();
}

function enDias(ahora: Date, dias: number): string {
  return new Date(ahora.getTime() + dias * DIA_MS).toISOString().slice(0, 10);
}

export function crearPedidosDemo(ahora: Date): Pedido[] {
  return [
    {
      numero: 'AE-1040',
      cliente: { nombre: 'Laura Gómez', ciudad: 'Medellín' },
      items: [
        {
          medidaId: '30x40',
          orientacion: 'vertical',
          material: 'mdf',
          cantidad: 2,
          archivo: 'boda-laura.jpg',
          calidad: 'buena',
          dpi: 256,
        },
      ],
      total: 120000,
      pagos: [{ monto: 60000, fecha: haceDias(ahora, 4), nota: 'Abono por transferencia' }],
      estado: 'en_produccion',
      historial: [
        { estado: 'recibido', fecha: haceDias(ahora, 5) },
        { estado: 'abono_confirmado', fecha: haceDias(ahora, 4) },
        { estado: 'en_produccion', fecha: haceDias(ahora, 1) },
      ],
      fechaEstimada: enDias(ahora, 4),
      notas: [{ fecha: haceDias(ahora, 1), texto: 'Tu cuadro entra a impresión mañana' }],
    },
    {
      numero: 'AE-1041',
      cliente: { nombre: 'Andrés Rojas', ciudad: 'Bogotá' },
      items: [
        {
          medidaId: '45x60',
          orientacion: 'horizontal',
          material: 'acrilico',
          cantidad: 2,
          archivo: 'familia-navidad.jpg',
          calidad: 'buena',
          dpi: 171,
        },
      ],
      total: 130000,
      pagos: [{ monto: 65000, fecha: haceDias(ahora, 8), nota: 'Abono por transferencia' }],
      estado: 'listo',
      historial: [
        { estado: 'recibido', fecha: haceDias(ahora, 9) },
        { estado: 'abono_confirmado', fecha: haceDias(ahora, 8) },
        { estado: 'en_produccion', fecha: haceDias(ahora, 6) },
        { estado: 'listo', fecha: haceDias(ahora, 1) },
      ],
      fechaEstimada: enDias(ahora, 2),
      notas: [
        {
          fecha: haceDias(ahora, 1),
          texto: 'Tu cuadro está listo. Cuando pagues el saldo lo enviamos.',
        },
      ],
    },
    {
      numero: 'AE-1042',
      cliente: { nombre: 'Camila Torres', ciudad: 'Cali' },
      items: [
        {
          medidaId: '60x80',
          orientacion: 'vertical',
          material: 'mdf',
          cantidad: 1,
          archivo: 'mascota.jpg',
          calidad: 'regular',
          dpi: 128,
        },
      ],
      total: 130000,
      pagos: [
        { monto: 65000, fecha: haceDias(ahora, 14), nota: 'Abono' },
        { monto: 65000, fecha: haceDias(ahora, 3), nota: 'Saldo' },
      ],
      estado: 'enviado',
      historial: [
        { estado: 'recibido', fecha: haceDias(ahora, 15) },
        { estado: 'abono_confirmado', fecha: haceDias(ahora, 14) },
        { estado: 'en_produccion', fecha: haceDias(ahora, 12) },
        { estado: 'listo', fecha: haceDias(ahora, 5) },
        { estado: 'saldo_pagado', fecha: haceDias(ahora, 3) },
        { estado: 'enviado', fecha: haceDias(ahora, 2) },
      ],
      fechaEstimada: enDias(ahora, 1),
      notas: [],
      // Transportadora ficticia, para no usar marcas reales.
      envio: { transportadora: 'Envíos Andinos (ficticia)', guia: '7001234567' },
    },
  ];
}
