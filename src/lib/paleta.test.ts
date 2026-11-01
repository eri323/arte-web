import { describe, expect, it } from 'vitest';
import { negocio } from '../config/negocio';
import {
  PALETAS_DEMO,
  baseDe,
  contraste,
  derivarPaleta,
  esColorHex,
  mezclar,
  revisarPaleta,
} from './paleta';

describe('contraste', () => {
  it('blanco sobre negro es 21 y un color sobre sí mismo es 1', () => {
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 1);
    expect(contraste('#ca3517', '#ca3517')).toBeCloseTo(1, 5);
  });

  it('es simétrico y coincide con la paleta de negocio.ts', () => {
    expect(contraste('#f4efe7', '#ca3517')).toBeCloseTo(contraste('#ca3517', '#f4efe7'), 5);
    expect(contraste('#a52110', '#f4efe7')).toBeCloseTo(6.52, 1);
  });

  it('ignora el canal alfa de un hex de 8 dígitos', () => {
    expect(contraste('#23181426', '#231814')).toBeCloseTo(1, 5);
  });
});

describe('mezclar', () => {
  it('t = 0 devuelve el primero, t = 1 el segundo y 0,5 el punto medio', () => {
    expect(mezclar('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mezclar('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mezclar('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('esColorHex', () => {
  it.each([
    ['#ca3517', true],
    ['#CA3517', true],
    ['#23181426', true],
    ['ca3517', false],
    ['#ca351', false],
    ['red', false],
    ['#ca3517;}body{display:none', false],
  ])('%s → %s', (valor, esperado) => {
    expect(esColorHex(valor)).toBe(esperado);
  });
});

describe('derivarPaleta', () => {
  it('conserva los tres colores base', () => {
    const c = derivarPaleta({ acento: '#2747c9', fondo: '#f4efe7', texto: '#231814' });
    expect([c.acento, c.fondo, c.texto]).toEqual(['#2747c9', '#f4efe7', '#231814']);
  });

  it('el acento fuerte y el texto suave se leen sobre el fondo y la superficie (4,5:1)', () => {
    for (const base of [
      baseDe(negocio.marca.colores),
      { acento: '#f2c94c', fondo: '#f4efe7', texto: '#231814' },
      { acento: '#e0a526', fondo: '#1d1a17', texto: '#f4efe7' },
    ]) {
      const c = derivarPaleta(base);
      expect(contraste(c.acentoFuerte, c.fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(c.acentoFuerte, c.superficie)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(c.textoSuave, c.superficie)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('sobre un acento oscuro va el fondo claro; sobre uno claro, el texto oscuro', () => {
    expect(
      derivarPaleta({ acento: '#ca3517', fondo: '#f4efe7', texto: '#231814' }).sobreAcento,
    ).toBe('#f4efe7');
    expect(
      derivarPaleta({ acento: '#f2c94c', fondo: '#f4efe7', texto: '#231814' }).sobreAcento,
    ).toBe('#231814');
  });

  it('el hover del botón sube el contraste con su texto y pasa 4,5:1', () => {
    for (const base of [
      baseDe(negocio.marca.colores),
      { acento: '#f2c94c', fondo: '#f4efe7', texto: '#231814' },
      ...PALETAS_DEMO.map((p) => p.base),
    ]) {
      const c = derivarPaleta(base);
      expect(contraste(c.sobreAcento, c.acentoHover)).toBeGreaterThanOrEqual(
        contraste(c.sobreAcento, c.acento),
      );
      expect(contraste(c.sobreAcento, c.acentoHover)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('las líneas son el texto con transparencia y la cinta no cambia', () => {
    const c = derivarPaleta({ acento: '#2747c9', fondo: '#f4efe7', texto: '#112233' });
    expect(c.linea).toBe('#11223326');
    expect(c.lineaFuerte).toBe('#11223340');
    expect(c.cinta).toBe(negocio.marca.colores.cinta);
  });
});

describe('revisarPaleta', () => {
  it('la paleta de negocio.ts pasa todas las revisiones', () => {
    expect(revisarPaleta(negocio.marca.colores).every((r) => r.ok)).toBe(true);
  });

  it('marca el texto gris claro sobre fondo blanco como ilegible', () => {
    const c = derivarPaleta({ acento: '#2747c9', fondo: '#ffffff', texto: '#bbbbbb' });
    const texto = revisarPaleta(c).find((r) => r.id === 'texto');
    expect(texto?.ok).toBe(false);
    expect(texto?.minimo).toBe(4.5);
  });

  it('marca un acento casi igual al fondo, porque los botones no se distinguen', () => {
    const c = derivarPaleta({ acento: '#efeae2', fondo: '#f4efe7', texto: '#231814' });
    expect(revisarPaleta(c).find((r) => r.id === 'acento')?.ok).toBe(false);
  });
});

describe('PALETAS_DEMO', () => {
  it('la primera es la de negocio.ts', () => {
    expect(PALETAS_DEMO[0]?.base).toEqual(baseDe(negocio.marca.colores));
  });

  it.each(PALETAS_DEMO.map((p) => [p.nombre, p] as const))(
    '%s pasa todas las revisiones',
    (_, paleta) => {
      expect(revisarPaleta(derivarPaleta(paleta.base)).filter((r) => !r.ok)).toEqual([]);
    },
  );
});
