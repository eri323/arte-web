import { persistentAtom } from '@nanostores/persistent';
import { negocio, type ColoresMarca } from '../config/negocio';
import { esColorHex } from '../lib/paleta';

// Colores elegidos en el panel del taller. Se guardan en localStorage y Base.astro los aplica antes
// de pintar cada página (script en línea), para que no se vea un parpadeo con los colores viejos.
// Sin valor guardado manda negocio.ts.

export const CLAVE_COLORES = 'arte-web:colores';

const CLAVES = Object.keys(negocio.marca.colores) as (keyof ColoresMarca)[];

/** Solo acepta un objeto con todas las claves de la marca y valores hex; si no, vuelve a negocio.ts. */
export function leerColores(texto: string): ColoresMarca | undefined {
  try {
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null) return undefined;
    const c = datos as Record<string, unknown>;
    return CLAVES.every((k) => typeof c[k] === 'string' && esColorHex(c[k]))
      ? (Object.fromEntries(CLAVES.map((k) => [k, c[k]])) as unknown as ColoresMarca)
      : undefined;
  } catch {
    return undefined;
  }
}

export const $colores = persistentAtom<ColoresMarca | undefined>(CLAVE_COLORES, undefined, {
  encode: JSON.stringify,
  decode: leerColores,
});

const variable = (clave: string) =>
  `--marca-${clave.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;

/** Pone (o quita) los colores como variables CSS en <html>, encima de las de negocio.ts. */
export function aplicarColores(colores: ColoresMarca | undefined, raiz = document.documentElement) {
  for (const k of CLAVES) {
    if (colores) raiz.style.setProperty(variable(k), colores[k]);
    else raiz.style.removeProperty(variable(k));
  }
}

export function restaurarColores(): void {
  $colores.set(undefined);
}
