import { useStore } from '@nanostores/react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as EventoPuntero,
} from 'react';
import { negocio, type DisenoCatalogo, type MaterialId } from '../../config/negocio';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { describirPromocion } from '../../lib/precios';
import { agregarAlCarrito } from '../../stores/carrito';
import { $medidas } from '../../stores/precios';
import GrupoOpciones from '../ui/GrupoOpciones';
import ArteCatalogo from './ArteCatalogo';

// Catálogo con filtros y la pared donde se cuelga el diseño elegido, con muebles a escala real.
// Todo lo que se mide va en centímetros: 1 cm = 100cqw / ancho de la escena, así que el cuadro y
// los muebles mantienen su proporción en cualquier pantalla sin medir nada con JS.

type Cuarto = 'cuarto' | 'sala' | 'estudio';

interface Pieza {
  x: number;
  y: number;
  w: number;
  h: number;
  fondo?: string;
  /** Radio en cm: [arriba, abajo]. */
  radio?: [number, number];
  borde?: string;
  led?: boolean;
}

interface Mueble {
  nombre: string;
  /** Texto de referencia para que el cliente entienda la escala. */
  referencia: string;
  /** Altura del centro del cuadro sobre el piso (la regla de montaje: 145–150 cm). */
  centroCm: number;
  anchoCm: number;
  altoCm: number;
  piezas: Pieza[];
}

// SUPUESTO: medidas típicas de muebles en Colombia (cama queen 160 cm, sofá de 2 m, escritorio de
// 1,40 m), para dar escala. No son de ningún mueble real.
const MUEBLES: Record<Cuarto, Mueble> = {
  cuarto: {
    nombre: 'Cuarto',
    referencia: 'La cama queen mide 1,60 m.',
    centroCm: 150,
    anchoCm: 240,
    altoCm: 100,
    piezas: [
      { x: 40, y: 0, w: 160, h: 100, fondo: '#2a2320', radio: [6, 0] },
      { x: 40, y: 98, w: 160, h: 1.2, led: true },
      { x: 52, y: 44, w: 62, h: 22, fondo: '#3b3632', radio: [10, 10] },
      { x: 126, y: 44, w: 62, h: 22, fondo: '#3b3632', radio: [10, 10] },
      {
        x: 36,
        y: 0,
        w: 168,
        h: 50,
        fondo: 'linear-gradient(180deg,#4a4440 0 18%,#2f2a27 18% 100%)',
        radio: [6, 0],
      },
      { x: 0, y: 0, w: 34, h: 52, fondo: '#1d1916' },
      { x: 206, y: 0, w: 34, h: 52, fondo: '#1d1916' },
    ],
  },
  sala: {
    nombre: 'Sala',
    referencia: 'El sofá mide 2 metros.',
    centroCm: 145,
    anchoCm: 210,
    altoCm: 80,
    piezas: [
      {
        x: 5,
        y: 0,
        w: 200,
        h: 80,
        fondo: 'linear-gradient(180deg,#2c2724,#1f1b19)',
        radio: [14, 3],
      },
      { x: 0, y: 0, w: 24, h: 58, fondo: '#272220', radio: [10, 1] },
      { x: 186, y: 0, w: 24, h: 58, fondo: '#272220', radio: [10, 1] },
    ],
  },
  estudio: {
    nombre: 'Estudio',
    referencia: 'El escritorio mide 1,40 m.',
    centroCm: 150,
    anchoCm: 150,
    altoCm: 120,
    piezas: [
      { x: 5, y: 71, w: 140, h: 4, fondo: '#2b2522' },
      { x: 5, y: 70, w: 140, h: 1, led: true },
      { x: 9, y: 0, w: 4, h: 71, fondo: '#1b1715' },
      { x: 137, y: 0, w: 4, h: 71, fondo: '#1b1715' },
      { x: 44, y: 75, w: 62, h: 36, fondo: '#0c0b0a', borde: '#2b2522', radio: [2, 2] },
      { x: 72, y: 75, w: 6, h: 4, fondo: '#2b2522' },
      { x: 48, y: 0, w: 4, h: 42, fondo: '#0f0d0c' },
      { x: 98, y: 0, w: 4, h: 42, fondo: '#0f0d0c' },
      { x: 42, y: 40, w: 66, h: 7, fondo: '#1a1614', radio: [3, 3] },
      { x: 46, y: 47, w: 58, h: 52, fondo: '#211c19', radio: [12, 3] },
    ],
  },
};

// SUPUESTO: la pared va siempre de noche (banda oscura con el oro del logo), aunque el resto del
// sitio sea claro, porque el LED solo se luce a oscuras. Redefine las variables de la marca solo
// dentro de esta sección.
const NOCHE: Record<string, string> = {
  fondo: '#0b0a09',
  superficie: '#15120f',
  texto: '#f3ece0',
  'texto-suave': '#a39a8e',
  acento: '#e7b94c',
  'acento-fuerte': '#e7b94c',
  'sobre-acento': '#0b0a09',
  'acento-hover': '#f6d88b',
  linea: '#f3ece01f',
  'linea-fuerte': '#f3ece040',
  cinta: '#f6d88b',
};
// Las clases de Tailwind leen --marca-* y las utilidades propias (boton-oro…) leen --color-*:
// se redefinen las dos.
const PARED_OSCURA = {
  ...Object.fromEntries(
    Object.entries(NOCHE).flatMap(([k, v]) => [
      [`--marca-${k}`, v],
      [`--color-${k}`, v],
    ]),
  ),
  colorScheme: 'dark',
} as CSSProperties;

const PISO_CM = 12;
const cm = (n: number) => `calc(${n} * var(--u))`;

const catalogo = negocio.catalogo;
const categorias = ['Todos', ...new Set(catalogo.map((d) => d.categoria))];

function reduceMovimiento(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** El cuadro se columpia en su clavo y se queda quieto: oscilación amortiguada. */
function columpiar(el: HTMLElement | null, amplitud: number) {
  if (!el || reduceMovimiento()) return;
  const inicio = performance.now();
  const paso = (t: number) => {
    const s = (t - inicio) / 1000;
    const env = amplitud * Math.exp(-s * 1.6);
    el.style.transform = `rotate(${env * Math.cos(s * 5.2)}deg)`;
    if (Math.abs(env) > 0.04) requestAnimationFrame(paso);
    else el.style.transform = '';
  };
  requestAnimationFrame(paso);
}

/** La cifra del precio corre del valor anterior al nuevo. */
function usePrecioAnimado(valor: number): number {
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(valor);
  useEffect(() => {
    const desde = anterior.current;
    anterior.current = valor;
    if (desde === valor || reduceMovimiento()) return setMostrado(valor);
    const inicio = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min((t - inicio) / 500, 1);
      const e = 1 - (1 - p) ** 3;
      setMostrado(Math.round(desde + (valor - desde) * e));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return mostrado;
}

export function ImagenDiseno({
  diseno,
  decorativa = false,
}: {
  diseno: DisenoCatalogo;
  decorativa?: boolean;
}) {
  if (diseno.foto) {
    return (
      <img
        src={diseno.foto.src}
        alt={decorativa ? '' : diseno.foto.alt}
        loading="lazy"
        className="block size-full object-cover"
      />
    );
  }
  return (
    <ArteCatalogo
      disenoId={diseno.id}
      titulo={decorativa ? undefined : `Diseño ${diseno.nombre}`}
    />
  );
}

function Tarjeta({
  diseno,
  desde,
  oculta,
  onVer,
}: {
  diseno: DisenoCatalogo;
  desde: number;
  oculta: boolean;
  onVer: () => void;
}) {
  const marco = useRef<HTMLDivElement>(null);

  // Brillo que sigue al cursor, como la luz sobre un acrílico.
  function mover(e: EventoPuntero<HTMLElement>) {
    const m = marco.current;
    if (!m || e.pointerType !== 'mouse') return;
    const r = m.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    m.style.setProperty('--mx', `${x * 100}%`);
    m.style.setProperty('--my', `${y * 100}%`);
  }
  function salir() {
    for (const v of ['--mx', '--my']) marco.current?.style.removeProperty(v);
  }

  return (
    <li
      hidden={oculta}
      className="group flex flex-col gap-3"
      onPointerMove={mover}
      onPointerLeave={salir}
    >
      <div ref={marco} className="sombra-cuadro relative aspect-[3/4]">
        <ImagenDiseno diseno={diseno} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(circle_at_var(--mx,30%)_var(--my,20%),rgb(255_255_255/.5),transparent_40%),linear-gradient(115deg,transparent_40%,rgb(255_255_255/.14)_48%,transparent_56%)]"
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.1em] text-texto-suave uppercase">
            {diseno.categoria}
          </p>
          <h3 className="font-display text-xl tracking-wide sm:text-2xl">{diseno.nombre}</h3>
        </div>
        <p className="text-sm whitespace-nowrap text-texto-suave">
          desde <b className="text-[0.9375rem] text-acento-fuerte">{formatearPesos(desde)}</b>
        </p>
      </div>
      <button
        type="button"
        onClick={onVer}
        className="min-h-11 self-start text-sm font-extrabold underline decoration-acento decoration-2 underline-offset-[6px] hover:decoration-[3px]"
      >
        Ver <span className="sr-only">{diseno.nombre} </span>en mi pared{' '}
        <span aria-hidden="true">→</span>
      </button>
    </li>
  );
}

export default function Vitrina() {
  const medidas = useStore($medidas);
  const [categoria, setCategoria] = useState('Todos');
  const [disenoId, setDisenoId] = useState(catalogo[0]?.id ?? '');
  // SUPUESTO: la pared arranca en 45×60, la medida de sala más común; si no existe, la tercera.
  const [medidaId, setMedidaId] = useState(
    (negocio.medidas.find((m) => m.id === '45x60') ?? negocio.medidas[2] ?? negocio.medidas[0])!.id,
  );
  const [material, setMaterial] = useState<MaterialId>('mdf');
  const [cuarto, setCuarto] = useState<Cuarto>('cuarto');
  const [led, setLed] = useState<'si' | 'no'>('si');
  const [agregado, setAgregado] = useState<string | null>(null);
  const colgado = useRef<HTMLDivElement>(null);
  const escena = useRef<HTMLDivElement>(null);

  const diseno = catalogo.find((d) => d.id === disenoId) ?? catalogo[0];
  const medida = medidas.find((m) => m.id === medidaId) ?? medidas[0]!;
  const mueble = MUEBLES[cuarto];
  const precio = usePrecioAnimado(medida.precio);
  const desde = Math.min(...medidas.map((m) => m.precio));
  const promocion = describirPromocion(medida.promocion);
  const nombreMaterial = negocio.materiales.find((m) => m.id === material)?.nombre ?? material;
  const mismoPrecio = negocio.materiales.every((m) => m.recargo === 0);

  function elegir(id: string, irALaPared: boolean) {
    setDisenoId(id);
    setAgregado(null);
    if (!irALaPared) return;
    document
      .getElementById('pared')
      ?.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => columpiar(colgado.current, 7), reduceMovimiento() ? 0 : 650);
  }

  // Los cuadros del abanico de la portada (fuera de esta isla) son links a #pared con
  // data-diseno: el navegador hace el scroll y aquí solo se elige el diseño.
  useEffect(() => {
    function alTocar(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest<HTMLElement>('[data-diseno]');
      const id = link?.dataset.diseno;
      if (!id || !catalogo.some((d) => d.id === id)) return;
      setDisenoId(id);
      setAgregado(null);
      setTimeout(() => columpiar(colgado.current, 7), reduceMovimiento() ? 0 : 650);
    }
    document.addEventListener('click', alTocar);
    return () => document.removeEventListener('click', alTocar);
  }, []);

  // El cuadro se columpia la primera vez que la pared entra en pantalla.
  useEffect(() => {
    if (!escena.current || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          columpiar(colgado.current, 6);
          o.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    o.observe(escena.current);
    return () => o.disconnect();
  }, []);

  function cambio<T>(set: (v: T) => void, amplitud = 3) {
    return (v: T) => {
      set(v);
      setAgregado(null);
      setTimeout(() => columpiar(colgado.current, amplitud), 120);
    };
  }

  function agregar() {
    if (!diseno) return;
    agregarAlCarrito({
      medidaId: medida.id,
      orientacion: 'vertical',
      material,
      cantidad: 1,
      recorte: { x: 0, y: 0, width: 100, height: 100 },
      archivo: diseno.nombre,
      // SUPUESTO: el arte del catálogo es del taller y está listo para imprimir en cualquier
      // medida, así que la calidad siempre es buena. Las dimensiones son nominales (300 dpi).
      dimensiones: {
        ancho: Math.round((medida.anchoCm / 2.54) * 300),
        alto: Math.round((medida.altoCm / 2.54) * 300),
      },
      dpi: 300,
      calidad: 'buena',
      disenoId: diseno.id,
    });
    setAgregado(`${diseno.nombre} en ${etiquetaMedida(medida)} cm, ${nombreMaterial}`);
  }

  if (!diseno) return null;

  const estiloEscena = {
    '--cmw': medida.anchoCm,
    '--cmh': medida.altoCm,
    '--centro': mueble.centroCm,
    '--piso': PISO_CM,
    '--led': led === 'si' ? 1 : 0,
  } as CSSProperties;
  // Centro a la altura de montaje, pero sin salirse del techo de la escena.
  const abajo = `calc((var(--piso) + min(var(--centro), var(--H) - var(--piso) - var(--cmh) / 2 - 10) - var(--cmh) / 2) * var(--u))`;
  const transicion =
    'width 750ms cubic-bezier(.34,1.45,.64,1), margin-left 750ms cubic-bezier(.34,1.45,.64,1), bottom 750ms cubic-bezier(.34,1.45,.64,1)';

  return (
    <>
      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="border-t border-linea bg-superficie py-[clamp(4rem,9vw,7.5rem)]"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 id="catalogo-titulo" className="font-display text-[clamp(2.5rem,6vw,4.75rem)]">
                {catalogo.length} diseños listos para colgar
              </h2>
            </div>
            <p className="max-w-[52ch] text-texto-suave">
              Toca «Ver en mi pared» y lo cuelgas en un cuarto, una sala o un estudio, a escala
              real.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtrar por categoría"
            className="mt-8 flex flex-wrap gap-2"
          >
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className="min-h-11 rounded-full border border-linea px-4 text-sm font-bold text-texto-suave transition-colors hover:border-linea-fuerte hover:text-texto aria-pressed:border-texto aria-pressed:bg-texto aria-pressed:text-fondo"
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="mt-7 grid grid-cols-2 gap-[clamp(14px,2vw,24px)] sm:grid-cols-3 lg:grid-cols-4">
            {catalogo.map((d) => (
              <Tarjeta
                key={d.id}
                diseno={d}
                desde={desde}
                oculta={categoria !== 'Todos' && d.categoria !== categoria}
                onVer={() => elegir(d.id, true)}
              />
            ))}
          </ul>
          <p className="mt-6 text-sm text-texto-suave">
            Diseños de ejemplo. Aquí van las fotos reales del catálogo del taller. El precio depende
            de la medida, no del diseño.
          </p>
        </div>
      </section>

      <section
        id="pared"
        aria-labelledby="pared-titulo"
        style={PARED_OSCURA}
        className="scroll-mt-16 bg-fondo py-[clamp(4rem,9vw,7.5rem)] text-texto"
      >
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-4 flex items-center gap-2.5 text-xs font-extrabold tracking-[0.22em] text-acento-fuerte uppercase before:h-0.5 before:w-[22px] before:bg-current">
            Ver en tu pared
          </p>
          <h2 id="pared-titulo" className="font-display text-[clamp(2.5rem,5vw,4.5rem)]">
            Míralo <span className="text-acento-fuerte">antes</span> de pedir
          </h2>
          <p className="mt-3 max-w-[52ch] text-texto-suave">
            {mueble.referencia} Todo está a escala real.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:items-start">
            <div
              ref={escena}
              style={estiloEscena}
              className="relative aspect-[4/5] overflow-hidden rounded-[20px] [--H:300] [--W:240] [--u:calc(100cqw/var(--W))] [container-type:inline-size] [background:radial-gradient(ellipse_34%_52%_at_50%_30%,rgb(255_226_180/.14),transparent_70%),linear-gradient(180deg,#1b1714,#0e0c0a)] shadow-[0_0_0_1px_var(--color-linea),0_40px_80px_-30px_#000] sm:aspect-video sm:[--H:225] sm:[--W:400]"
            >
              {/* Luz roja del LED sobre la pared. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 [background:radial-gradient(ellipse_30%_46%_at_50%_32%,rgb(255_45_32/.55),transparent_70%),linear-gradient(180deg,rgb(255_45_32/.1),transparent_40%)]"
                style={{ opacity: 'var(--led)' }}
              />
              {(Object.keys(MUEBLES) as Cuarto[]).map((k) => {
                const m = MUEBLES[k];
                const visible = k === cuarto;
                return (
                  <div
                    key={k}
                    aria-hidden="true"
                    className="absolute left-1/2 z-[1] transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                    style={{
                      bottom: cm(PISO_CM),
                      width: cm(m.anchoCm),
                      height: cm(m.altoCm),
                      opacity: visible ? 1 : 0,
                      transform: visible
                        ? 'translateX(-50%)'
                        : `translateX(-50%) translateY(${cm(24)})`,
                    }}
                  >
                    {m.piezas.map((p, i) => (
                      <i
                        key={i}
                        className="absolute block transition-[box-shadow,background-color] duration-500"
                        style={{
                          left: cm(p.x),
                          bottom: cm(p.y),
                          width: cm(p.w),
                          height: cm(p.h),
                          background: p.led
                            ? `rgb(255 80 60 / calc(.25 + var(--led) * .75))`
                            : p.fondo,
                          boxShadow: p.led
                            ? `0 0 ${cm(8)} ${cm(2)} rgb(255 45 32 / calc(var(--led) * .9))`
                            : undefined,
                          border: p.borde ? `${cm(1.5)} solid ${p.borde}` : undefined,
                          borderRadius: p.radio
                            ? `${cm(p.radio[0])} ${cm(p.radio[0])} ${cm(p.radio[1])} ${cm(p.radio[1])}`
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 [background:linear-gradient(180deg,#221d19,#121010)]"
                style={{ height: cm(PISO_CM) }}
              />

              {/* El cuadro, colgado de un clavo. */}
              <div
                className="absolute left-1/2 z-[2]"
                style={{
                  width: cm(medida.anchoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: abajo,
                  transition: transicion,
                }}
              >
                <div ref={colgado} className="relative origin-[50%_-26px]">
                  <span
                    aria-hidden="true"
                    className="absolute -top-7 left-1/2 z-[2] -ml-[4.5px] size-[9px] rounded-full [background:radial-gradient(circle_at_35%_35%,#e8dccb,#6d625b_70%)]"
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 46"
                    preserveAspectRatio="none"
                    className="absolute -top-6 left-0 h-[34px] w-full overflow-visible"
                  >
                    <polyline
                      points="12,46 50,2 88,46"
                      fill="none"
                      stroke="#8a7f74"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div
                    className={`relative bg-black transition-shadow duration-500 ${
                      material === 'acrilico' ? 'sombra-acrilico' : 'sombra-cuadro'
                    }`}
                    style={{ aspectRatio: `${medida.anchoCm} / ${medida.altoCm}` }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -inset-[6%] -z-10 rounded-md transition-opacity duration-500"
                      style={{
                        opacity: 'var(--led)',
                        boxShadow: `0 0 ${cm(14)} ${cm(6)} rgb(255 45 32 / .55)`,
                      }}
                    />
                    <ImagenDiseno diseno={diseno} />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-400 [background:radial-gradient(circle_at_30%_20%,rgb(255_255_255/.5),transparent_40%),linear-gradient(115deg,transparent_40%,rgb(255_255_255/.2)_48%,transparent_56%)] ${
                        material === 'acrilico' ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cota con la medida, debajo del cuadro. */}
              <div
                aria-hidden="true"
                className="lapiz absolute left-1/2 z-[2] flex items-center gap-2 whitespace-nowrap text-cinta before:h-px before:min-w-1.5 before:flex-1 before:bg-current after:h-px after:min-w-1.5 after:flex-1 after:bg-current"
                style={{
                  width: cm(medida.anchoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: `calc(${abajo} - 26px)`,
                  transition: transicion,
                }}
              >
                {etiquetaMedida(medida)} cm
              </div>
            </div>

            <div className="flex flex-col gap-5 rounded-2xl border border-linea bg-superficie p-5">
              <div>
                <p className="font-display text-3xl leading-none">{diseno.nombre}</p>
                <p className="mt-1 text-sm text-texto-suave">{diseno.categoria}</p>
              </div>
              <div>
                <p className="font-display text-5xl text-acento-fuerte tabular-nums">
                  {formatearPesos(precio)}
                </p>
                <p className="mt-1 text-sm text-texto-suave">
                  Precio por cuadro{mismoPrecio ? ', igual en MDF y en acrílico' : ''}.
                  {promocion && ` Promoción: ${promocion}.`}
                </p>
              </div>
              <GrupoOpciones
                nombre="vitrina-medida"
                leyenda="Medida (cm)"
                columnas="grid-cols-3"
                valor={medida.id}
                onCambio={cambio(setMedidaId, 5)}
                opciones={medidas.map((m) => ({ valor: m.id, etiqueta: etiquetaMedida(m) }))}
              />
              <GrupoOpciones
                nombre="vitrina-material"
                leyenda="Acabado"
                columnas="grid-cols-2"
                valor={material}
                onCambio={cambio(setMaterial)}
                opciones={negocio.materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
              />
              <GrupoOpciones
                nombre="vitrina-cuarto"
                leyenda="Espacio"
                columnas="grid-cols-3"
                valor={cuarto}
                onCambio={cambio(setCuarto)}
                opciones={(Object.keys(MUEBLES) as Cuarto[]).map((k) => ({
                  valor: k,
                  etiqueta: MUEBLES[k].nombre,
                }))}
              />
              <GrupoOpciones
                nombre="vitrina-led"
                leyenda="Ambiente"
                columnas="grid-cols-2"
                valor={led}
                onCambio={cambio(setLed)}
                opciones={[
                  { valor: 'no', etiqueta: 'Luz normal' },
                  { valor: 'si', etiqueta: 'LED rojo' },
                ]}
              />
              <button type="button" onClick={agregar} className="boton boton-oro w-full">
                Agregar al pedido
              </button>
              <div aria-live="polite" className="text-sm">
                {agregado && (
                  <p>
                    Listo: {agregado} está en tu pedido.{' '}
                    <a
                      href="/pedido"
                      className="font-bold text-acento-fuerte underline underline-offset-4"
                    >
                      Ver mi pedido
                    </a>
                  </p>
                )}
              </div>
              <a href="/crear" className="enlace-fuerte -mt-2 self-start text-sm">
                Prefiero ponerle mi foto
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
