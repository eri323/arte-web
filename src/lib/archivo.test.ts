import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import { escalarDimensiones, esHeic, MENSAJE_HEIC, validarArchivo } from './archivo';

const MB = 1024 * 1024;

describe('validarArchivo', () => {
  it.each([
    ['foto.jpg', 'image/jpeg'],
    ['foto.png', 'image/png'],
    ['foto.webp', 'image/webp'],
  ])('acepta %s', (name, type) => {
    expect(validarArchivo({ name, type, size: 3 * MB }, negocio.archivo)).toEqual({ ok: true });
  });

  it('rechaza archivos de más de 25 MB', () => {
    const r = validarArchivo(
      { name: 'g.jpg', type: 'image/jpeg', size: 25 * MB + 1 },
      negocio.archivo,
    );
    expect(r).toEqual({
      ok: false,
      motivo: 'tamano',
      mensaje: 'La foto pesa más de 25 MB. Envía una versión más liviana o mándala por WhatsApp.',
    });
  });

  it('rechaza otros formatos', () => {
    const r = validarArchivo(
      { name: 'doc.pdf', type: 'application/pdf', size: MB },
      negocio.archivo,
    );
    expect(r).toMatchObject({ ok: false, motivo: 'tipo' });
  });

  it.each([
    ['IMG_0001.HEIC', ''],
    ['IMG_0001.heic', 'image/heic'],
    ['foto.heif', 'image/heif'],
  ])('marca HEIC (%s) para intentar decodificarlo', (name, type) => {
    expect(validarArchivo({ name, type, size: MB }, negocio.archivo)).toEqual({
      ok: false,
      motivo: 'heic',
      mensaje: MENSAJE_HEIC,
    });
    expect(esHeic({ name, type })).toBe(true);
  });

  it('el mensaje de HEIC es el de la sección 10', () => {
    expect(MENSAJE_HEIC).toBe(
      'Tu foto está en formato HEIC. Cámbiala a JPG (en iPhone: Ajustes › Cámara › Formatos › Más compatible) o envíala por WhatsApp',
    );
  });
});

describe('escalarDimensiones', () => {
  it.each([
    [8000, 6000, { ancho: 2000, alto: 1500 }],
    [3024, 4032, { ancho: 1500, alto: 2000 }],
    [800, 600, { ancho: 800, alto: 600 }],
    [2000, 2000, { ancho: 2000, alto: 2000 }],
  ])('%i×%i → %j', (ancho, alto, esperado) => {
    expect(escalarDimensiones(ancho, alto, 2000)).toEqual(esperado);
  });
});
