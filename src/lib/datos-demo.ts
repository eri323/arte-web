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
      numero: 'RT-1040',
      cliente: { nombre: 'Laura Gómez', ciudad: 'Medellín' },
      items: [
        {
          medidaId: 'p-35x50',
          orientacion: 'vertical',
          material: 'vidrio',
          cantidad: 1,
          archivo: 'Mazda 3 2019',
          calidad: 'buena',
          dpi: 300,
          encargo: {
            vehiculo: 'Mazda 3 2019',
            detalles: 'Rojo, rines negros de 18, con la placa.',
            fotos: 3,
          },
        },
      ],
      total: 160000,
      pagos: [{ monto: 80000, fecha: haceDias(ahora, 4), nota: 'Abono por transferencia' }],
      estado: 'en_produccion',
      historial: [
        { estado: 'recibido', fecha: haceDias(ahora, 5) },
        { estado: 'abono_confirmado', fecha: haceDias(ahora, 4) },
        { estado: 'en_produccion', fecha: haceDias(ahora, 1) },
      ],
      fechaEstimada: enDias(ahora, 4),
      notas: [
        {
          fecha: haceDias(ahora, 1),
          texto: 'Tu diseño está aprobado: mañana entra a impresión y enmarcado',
        },
      ],
    },
    {
      numero: 'RT-1041',
      cliente: { nombre: 'Andrés Rojas', ciudad: 'Bogotá' },
      items: [
        {
          medidaId: '35x50-acrilico',
          orientacion: 'vertical',
          material: 'acrilico',
          cantidad: 2,
          archivo: 'Ayrton Senna · Mónaco 1990',
          calidad: 'buena',
          dpi: 300,
          disenoId: 'senna-monaco-1990',
        },
      ],
      total: 190000,
      pagos: [{ monto: 95000, fecha: haceDias(ahora, 8), nota: 'Abono por transferencia' }],
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
          texto: 'Tus pósters están enmarcados. Cuando pagues el saldo los enviamos.',
        },
      ],
    },
    {
      numero: 'RT-1042',
      cliente: { nombre: 'Camila Torres', ciudad: 'Cali' },
      items: [
        {
          medidaId: '50x70',
          orientacion: 'vertical',
          material: 'vidrio',
          cantidad: 1,
          archivo: 'Nürburgring Nordschleife',
          calidad: 'buena',
          dpi: 300,
          disenoId: 'nordschleife',
        },
      ],
      total: 265000,
      pagos: [
        { monto: 132500, fecha: haceDias(ahora, 14), nota: 'Abono' },
        { monto: 132500, fecha: haceDias(ahora, 3), nota: 'Saldo' },
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
