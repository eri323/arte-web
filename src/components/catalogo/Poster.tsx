import type { CSSProperties } from 'react';
import type { DisenoCatalogo } from '../../config/negocio';

// Un póster del catálogo dentro de su marco negro, a la forma real del arte (vertical,
// horizontal o panorámico). No lleva JS: se puede usar en páginas .astro sin hidratar.

export type Forma = 'vertical' | 'horizontal' | 'panoramico';

export function formaDe(diseno: DisenoCatalogo | undefined): Forma {
  if (diseno?.foto?.panoramico) return 'panoramico';
  return diseno?.foto?.orientacion === 'horizontal' ? 'horizontal' : 'vertical';
}

/** ancho / alto del arte, sin el marco. Los verticales son de proporción A (5:7). */
export const PROPORCION: Record<Forma, number> = {
  vertical: 5 / 7,
  horizontal: 7 / 5,
  panoramico: 2.5,
};

// El marco mide lo mismo en cm en cualquier forma; en porcentaje del ancho cambia.
const MARCO: Record<Forma, string> = { vertical: '3.6%', horizontal: '2.6%', panoramico: '1.5%' };

interface Props {
  diseno: DisenoCatalogo;
  /** Sin texto alternativo: cuando el nombre ya está escrito al lado. */
  decorativa?: boolean;
  cargar?: 'lazy' | 'eager';
  /** Ignora la forma del arte y llena la caja que le den (la pared lo usa con medidas en cm). */
  llenar?: boolean;
  className?: string;
}

export default function Poster({
  diseno,
  decorativa = false,
  cargar = 'lazy',
  llenar = false,
  className = '',
}: Props) {
  const forma = formaDe(diseno);
  if (!diseno.foto) return null;
  return (
    <span
      className={`marco sombra-cuadro ${llenar ? 'size-full' : ''} ${className}`}
      style={
        {
          '--marco': MARCO[forma],
          ...(llenar ? {} : { aspectRatio: String(PROPORCION[forma]) }),
        } as CSSProperties
      }
    >
      <img
        src={diseno.foto.src}
        alt={decorativa ? '' : diseno.foto.alt}
        loading={cargar}
        decoding="async"
      />
    </span>
  );
}
