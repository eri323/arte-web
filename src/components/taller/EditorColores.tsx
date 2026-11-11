import { useEffect, useState } from 'react';
import { negocio } from '../../config/negocio';
import {
  PALETAS_DEMO,
  baseDe,
  derivarPaleta,
  revisarPaleta,
  type BasePaleta,
} from '../../lib/paleta';
import { $colores, aplicarColores, restaurarColores } from '../../stores/marca';

const ORIGINAL = baseDe(negocio.marca.colores);

const iguales = (a: BasePaleta, b: BasePaleta) =>
  a.acento.toLowerCase() === b.acento.toLowerCase() &&
  a.fondo.toLowerCase() === b.fondo.toLowerCase() &&
  a.texto.toLowerCase() === b.texto.toLowerCase();

const formatearRatio = (n: number) => `${n.toFixed(1).replace('.', ',')}:1`;

const CAMPOS: { clave: keyof BasePaleta; etiqueta: string; ayuda: string }[] = [
  { clave: 'acento', etiqueta: 'Color de firma', ayuda: 'Portada, botones y detalles' },
  { clave: 'fondo', etiqueta: 'Pared', ayuda: 'El fondo de todas las páginas' },
  { clave: 'texto', etiqueta: 'Texto', ayuda: 'Títulos y párrafos' },
];

/** Colores de la marca: se ven en vivo en todo el sitio y se guardan en este navegador. */
export default function EditorColores() {
  const [base, setBase] = useState<BasePaleta>(ORIGINAL);
  const propuesta = derivarPaleta(base);
  const revisiones = revisarPaleta(propuesta);
  const valida = revisiones.every((r) => r.ok);

  // Arranca con lo guardado (después de hidratar, para que el HTML del servidor coincida) y aplica
  // cada cambio a las variables CSS de la página.
  useEffect(() => {
    const guardados = $colores.get();
    if (guardados) setBase(baseDe(guardados));
    return $colores.subscribe((c) => aplicarColores(c));
  }, []);

  function elegir(nueva: BasePaleta) {
    setBase(nueva);
    if (iguales(nueva, ORIGINAL)) return restaurarColores();
    const colores = derivarPaleta(nueva);
    // Una paleta ilegible no se guarda: el sitio se queda con la última que sí se leía.
    if (revisarPaleta(colores).every((r) => r.ok)) $colores.set(colores);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 font-semibold">Paletas de ejemplo</legend>
          <div className="flex flex-wrap gap-2">
            {PALETAS_DEMO.map((p) => (
              <button
                key={p.nombre}
                type="button"
                aria-pressed={iguales(base, p.base)}
                onClick={() => elegir(p.base)}
                className="flex min-h-11 items-center gap-2 rounded-sm border border-linea-fuerte px-3 text-sm hover:border-texto aria-pressed:border-texto aria-pressed:font-semibold aria-pressed:outline-2 aria-pressed:outline-texto"
              >
                <span aria-hidden="true" className="flex">
                  {[p.base.fondo, p.base.acento, p.base.texto].map((color, i) => (
                    <span
                      key={i}
                      className="-ml-1 size-5 rounded-full border border-black/20 first:ml-0"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                {p.nombre}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          {CAMPOS.map(({ clave, etiqueta, ayuda }) => (
            <label
              key={clave}
              className="flex items-center gap-3 rounded-sm border border-linea-fuerte p-3"
            >
              <input
                type="color"
                value={base[clave]}
                onChange={(e) => elegir({ ...base, [clave]: e.target.value })}
                className="size-11 shrink-0 cursor-pointer rounded-sm border border-linea-fuerte bg-transparent"
              />
              <span className="flex flex-col">
                <span className="font-semibold">{etiqueta}</span>
                <span className="text-sm text-texto-suave">{ayuda}</span>
                <span className="lapiz text-texto-suave">{base[clave].toUpperCase()}</span>
              </span>
            </label>
          ))}
        </div>

        <div aria-live="polite">
          <ul className="flex flex-col gap-1 text-sm">
            {revisiones.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-flex size-5 items-center justify-center rounded-sm text-xs font-bold ${
                    r.ok ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                  }`}
                >
                  {r.ok ? '✓' : '!'}
                </span>
                <span>
                  {r.etiqueta}: {formatearRatio(r.ratio)}{' '}
                  <span className="text-texto-suave">
                    (mínimo {formatearRatio(r.minimo)}){r.ok ? '' : ' · no se lee bien'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {!valida && (
            <p className="mt-2 rounded-sm border border-red-700/50 bg-red-600/10 p-3 text-sm">
              Con esta combinación hay textos que no se leerían, así que el sitio sigue con la
              última paleta legible. Prueba un texto más oscuro, una pared más clara o un color de
              firma más fuerte.
            </p>
          )}
          <p className="mt-2 text-sm text-texto-suave">
            Los tonos para textos pequeños y bordes se ajustan solos para que todo pase contraste
            AA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="/" className="enlace-fuerte text-acento-fuerte">
            Ver la portada con estos colores
          </a>
          <button
            type="button"
            onClick={() => elegir(ORIGINAL)}
            className="inline-flex min-h-11 items-center rounded-sm border border-linea-fuerte px-4 text-sm hover:border-texto"
          >
            Volver a los colores originales
          </button>
        </div>
      </div>

      <figure aria-label="Vista previa de la marca" className="flex flex-col gap-2">
        <div className="bg-acento p-6 text-sobre-acento">
          <p className="font-display text-4xl leading-none">
            {[negocio.vitrina.titular, negocio.vitrina.titularSuave].filter(Boolean).join(' ')}
          </p>
          <span className="boton mt-6 bg-sobre-acento text-acento">Ver el catálogo</span>
        </div>
        <div className="border border-linea bg-superficie p-4">
          <p className="font-display text-2xl text-acento-fuerte">Así se ve un título</p>
          <p className="mt-1 text-texto-suave">Y así un texto secundario sobre una banda.</p>
          <span className="boton mt-4 bg-acento text-sobre-acento">Agregar al pedido</span>
        </div>
        <figcaption className="text-sm text-texto-suave">
          En la versión real el taller elige sus colores una vez y quedan para todos sus clientes.
          En la demo se guardan en este navegador.
        </figcaption>
      </figure>
    </div>
  );
}
