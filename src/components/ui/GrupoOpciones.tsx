import type { ReactNode } from 'react';

// Grupo de radios nativos con estilo de botón: se navega con flechas y Tab como cualquier radio.
// `caja`: celdas sueltas (configurador). `seg`: celdas unidas por líneas de 1 px (panel de la pared).

interface Opcion<T extends string> {
  valor: T;
  etiqueta: ReactNode;
  detalle?: ReactNode;
}

interface Props<T extends string> {
  nombre: string;
  leyenda: string;
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
  columnas?: string;
  variante?: 'caja' | 'seg';
}

export default function GrupoOpciones<T extends string>({
  nombre,
  leyenda,
  opciones,
  valor,
  onCambio,
  columnas = 'grid-cols-2 sm:grid-cols-3',
  variante = 'caja',
}: Props<T>) {
  const seg = variante === 'seg';
  return (
    <fieldset>
      <legend
        className={
          seg
            ? 'mb-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-texto-suave uppercase'
            : 'mb-2 text-sm font-medium text-texto-suave'
        }
      >
        {leyenda}
      </legend>
      <div
        className={`grid ${columnas} ${seg ? 'gap-px border border-linea-fuerte bg-linea-fuerte' : 'gap-2'}`}
      >
        {opciones.map((o) => (
          <label key={o.valor} className="relative cursor-pointer">
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => onCambio(o.valor)}
              className="peer sr-only"
            />
            {seg ? (
              <span className="flex h-full min-h-11 items-center justify-center bg-fondo px-1.5 text-[0.8125rem] whitespace-nowrap text-texto-suave tabular-nums transition-colors duration-300 hover:text-texto peer-checked:bg-texto peer-checked:text-fondo peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-current">
                {o.etiqueta}
              </span>
            ) : (
              <span className="flex h-full min-h-11 flex-col justify-center rounded-[2px] border border-linea-fuerte px-3 py-2 transition-colors duration-300 hover:border-texto peer-checked:border-texto peer-checked:bg-superficie peer-checked:shadow-[inset_0_0_0_1px_var(--color-texto)] peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-texto">
                <span className="font-medium">{o.etiqueta}</span>
                {o.detalle && <span className="text-sm text-texto-suave">{o.detalle}</span>}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
