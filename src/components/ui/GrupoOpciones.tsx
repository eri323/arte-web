import type { ReactNode } from 'react';

// Grupo de radios nativos con estilo de botón: se navega con flechas y Tab como cualquier radio.

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
}

export default function GrupoOpciones<T extends string>({
  nombre,
  leyenda,
  opciones,
  valor,
  onCambio,
  columnas = 'grid-cols-2 sm:grid-cols-3',
}: Props<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-texto-suave">{leyenda}</legend>
      <div className={`grid gap-2 ${columnas}`}>
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
            <span className="flex min-h-11 flex-col justify-center rounded-lg border border-white/15 px-3 py-2 peer-checked:border-dorado peer-checked:bg-dorado/10 peer-focus-visible:ring-2 peer-focus-visible:ring-dorado">
              <span className="font-medium">{o.etiqueta}</span>
              {o.detalle && <span className="text-sm text-texto-suave">{o.detalle}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
