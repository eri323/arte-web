import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { calcularDesglose } from './precios';
import {
  construirMensaje,
  esModoDemo,
  MAX_CARACTERES_MENSAJE,
  urlWhatsApp,
  type DatosMensaje,
  type ItemMensaje,
} from './whatsapp';

function item(parcial: Partial<ItemMensaje> = {}): ItemMensaje {
  return {
    medidaId: '30x40',
    orientacion: 'vertical',
    material: 'mdf',
    cantidad: 2,
    archivo: 'cumpleaños de mamá.jpg',
    calidad: 'buena',
    ...parcial,
  };
}

function datos(items: ItemMensaje[]): DatosMensaje {
  return {
    numero: 'AE-1043',
    items,
    desglose: calcularDesglose(items, negocio.medidas, 50),
    cliente: { nombre: 'Peña & Hijos', ciudad: 'Bogotá', celular: '3001234567', nota: 'Sin marco' },
    negocio,
  };
}

describe('construirMensaje', () => {
  const mensaje = construirMensaje(
    datos([
      item(),
      item({
        medidaId: '45x60',
        cantidad: 1,
        orientacion: 'horizontal',
        material: 'acrilico',
        calidad: 'regular',
      }),
    ]),
  );

  it('lleva número, ítems, desglose, cliente, envío y la línea de fotos', () => {
    expect(mensaje).toContain('AE-1043');
    expect(mensaje).toContain('30×40 vertical · MDF · x2');
    expect(mensaje).toContain('60×45 horizontal · Acrílico · x1');
    expect(mensaje).toContain('cumpleaños de mamá.jpg');
    expect(mensaje).toContain('calidad regular');
    expect(mensaje).toMatch(/Subtotal: \$\s200\.000/);
    expect(mensaje).toMatch(/Descuento: \$\s0/);
    expect(mensaje).toMatch(/Total: \$\s200\.000/);
    expect(mensaje).toMatch(/Abono \(50%\): \$\s100\.000/);
    expect(mensaje).toMatch(/Saldo: \$\s100\.000/);
    expect(mensaje).toContain('Peña & Hijos');
    expect(mensaje).toContain('Bogotá');
    expect(mensaje).toContain('Envío: Se cotiza por WhatsApp según tu ciudad');
    expect(mensaje).toContain('Adjunto mis fotos en este chat');
  });

  it('muestra el descuento por medida cuando hay promoción', () => {
    const m = construirMensaje(datos([item({ cantidad: 3 })]));
    expect(m).toMatch(/30×40 x3: \$\s180\.000 − \$\s60\.000 = \$\s120\.000/);
  });

  it('se mantiene bajo el límite con muchos ítems', () => {
    const muchos = Array.from({ length: 60 }, (_, i) =>
      item({ archivo: `foto-de-vacaciones-en-la-playa-numero-${i}-muy-larga.jpeg`, cantidad: 1 }),
    );
    const m = construirMensaje(datos(muchos));
    expect(m.length).toBeLessThanOrEqual(MAX_CARACTERES_MENSAJE);
    expect(m).toMatch(/Total: \$\s2\.400\.000/);
    expect(m).toContain('Adjunto mis fotos en este chat');
  });

  it('con pocos ítems no compacta', () => {
    expect(mensaje.length).toBeLessThan(MAX_CARACTERES_MENSAJE);
    expect(mensaje).toContain('Foto:');
  });
});

describe('urlWhatsApp', () => {
  it('codifica tildes, ñ, saltos de línea y &', () => {
    expect(urlWhatsApp('573001234567', 'Peña & Ñandú\nsí')).toBe(
      'https://wa.me/573001234567?text=Pe%C3%B1a%20%26%20%C3%91and%C3%BA%0As%C3%AD',
    );
  });

  it('en modo demo (número vacío) no hay URL', () => {
    expect(urlWhatsApp('', 'hola')).toBeNull();
    expect(urlWhatsApp('   ', 'hola')).toBeNull();
    expect(esModoDemo('')).toBe(true);
    expect(esModoDemo('573001234567')).toBe(false);
  });

  it('quita el + y los espacios del número', () => {
    expect(urlWhatsApp('+57 300 123 4567', 'a')).toBe('https://wa.me/573001234567?text=a');
  });
});
