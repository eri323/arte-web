import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { MEDIDAS } from '../../tests/fixtures/medidas';
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
    material: 'vidrio',
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
    desglose: calcularDesglose(items, MEDIDAS, 50),
    cliente: { nombre: 'Peña & Hijos', ciudad: 'Bogotá', celular: '3001234567', nota: 'Sin marco' },
    negocio: { ...negocio, medidas: MEDIDAS },
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
    expect(mensaje).toContain('30×40 vertical · Vidrio · x2');
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
    expect(mensaje).toContain(`Envío: ${negocio.envio.texto}`);
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

describe('personalizados', () => {
  const encargo = {
    vehiculo: 'Carro: Mazda 3 2019',
    detalles: 'Estilo ficha técnica. color rojo',
    fotos: 2,
  };

  it('llevan el vehículo, los detalles y piden las fotos de referencia', () => {
    const m = construirMensaje(datos([item({ archivo: 'Mazda 3 2019', encargo })]));
    expect(m).toContain('Personalizado: Carro: Mazda 3 2019');
    expect(m).toContain('Detalles: Estilo ficha técnica. color rojo');
    expect(m).not.toContain('Foto:');
    expect(m).toContain('Adjunto las fotos de referencia de mi vehículo en este chat.');
  });

  it('con muchos se compactan sin perder el vehículo', () => {
    const muchos = Array.from({ length: 40 }, () => item({ cantidad: 1, encargo }));
    const m = construirMensaje(datos(muchos));
    expect(m.length).toBeLessThanOrEqual(MAX_CARACTERES_MENSAJE);
    expect(m).toContain('Personalizado Carro: Mazda 3 2019');
  });
});

describe('diseños del catálogo', () => {
  it('se nombran como diseño y sin fotos no piden adjuntarlas', () => {
    const solo = construirMensaje(datos([item({ archivo: 'Ronin', disenoId: 'ronin' })]));
    expect(solo).toContain('Diseño del catálogo: Ronin');
    expect(solo).not.toContain('Foto: Ronin');
    expect(solo).not.toContain('Adjunto mis fotos');
  });

  it('con una foto propia en el pedido sí se pide adjuntarla', () => {
    const mixto = construirMensaje(datos([item({ archivo: 'Ronin', disenoId: 'ronin' }), item()]));
    expect(mixto).toContain('Diseño del catálogo: Ronin');
    expect(mixto).toContain('Adjunto mis fotos en este chat.');
  });
});
