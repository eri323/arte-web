import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import { negocio, type Promocion } from '../config/negocio';
import { aplicarEdiciones, type EdicionesPrecios } from '../lib/precios';

// Las páginas se generan con los precios de negocio.ts. Lo que edita el panel del taller se guarda
// aquí (localStorage) y se aplica encima, para que todas las islas muestren los precios activos.

function leerEdiciones(texto: string): EdicionesPrecios {
  try {
    const datos: unknown = JSON.parse(texto);
    return datos && typeof datos === 'object' ? (datos as EdicionesPrecios) : {};
  } catch {
    return {};
  }
}

export const $edicionesPrecios = persistentAtom<EdicionesPrecios>(
  'arte-web:precios',
  {},
  { encode: JSON.stringify, decode: leerEdiciones },
);

export const $medidas = computed($edicionesPrecios, (ediciones) =>
  aplicarEdiciones(negocio.medidas, ediciones),
);

export function editarMedida(
  id: string,
  cambios: { precio?: number; promocion?: Promocion | null },
): void {
  const actuales = $edicionesPrecios.get();
  $edicionesPrecios.set({ ...actuales, [id]: { ...actuales[id], ...cambios } });
}

export function restaurarPrecios(): void {
  $edicionesPrecios.set({});
}
