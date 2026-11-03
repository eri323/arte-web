import { useStore } from '@nanostores/react';
import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { negocio, type DisenoCatalogo, type MaterialId } from '../../config/negocio';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { describirPromocion } from '../../lib/precios';
import { agregarAlCarrito } from '../../stores/carrito';
import { $medidas } from '../../stores/precios';
import { $imagenPropia, ponerImagenPropia } from '../../stores/vitrina';
import GrupoOpciones from '../ui/GrupoOpciones';
import ArteCatalogo, { nombreVariante, VARIANTES, type VarianteId } from './ArteCatalogo';

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

const PISO_CM = 12;
const cm = (n: number) => `calc(${n} * var(--u))`;

const catalogo = negocio.catalogo;
const categorias = ['Todos', ...new Set(catalogo.map((d) => d.categoria))];

// Las tres formas de pedir: el catálogo es punto de partida, no un menú cerrado.
const MODOS = [
  { titulo: 'Tal cual', texto: 'Te gusta una referencia y la hacemos igual.' },
  { titulo: 'Adaptado', texto: 'Cambiamos colores, texto, estilo o medida.' },
  { titulo: 'Desde cero', texto: 'Nos cuentas tu idea y la diseñamos contigo.' },
];

/** Muestra de cada variante de color: un círculo partido en dos. */
const MUESTRA: Record<VarianteId, string> = {
  orig: 'conic-gradient(#ff5fa2,#ffd23f,#7fd7e8,#ff5fa2)',
  oro: 'linear-gradient(135deg,#0b0a09 50%,#e3b54a 50%)',
  led: 'linear-gradient(135deg,#110606 50%,#ff2d20 50%)',
  bn: 'linear-gradient(135deg,#2a2622 50%,#f1ece4 50%)',
};

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
    const env = amplitud * Math.exp(-s * 2.4);
    el.style.transform = `rotate(${env * Math.cos(s * 4.2)}deg)`;
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
  variante = 'orig',
}: {
  diseno: DisenoCatalogo;
  decorativa?: boolean;
  variante?: VarianteId;
}) {
  // Con foto real del taller no hay variantes de color: se muestra la foto tal cual.
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
      variante={variante}
      titulo={decorativa ? undefined : `Diseño ${diseno.nombre}`}
    />
  );
}

/** Círculos para ver la misma idea en otros colores. */
function Muestras({
  valor,
  onCambio,
  etiqueta,
  grande = false,
}: {
  valor: VarianteId;
  onCambio: (v: VarianteId) => void;
  etiqueta: string;
  grande?: boolean;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="-m-1.5 flex shrink-0">
      {VARIANTES.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-label={v.nombre}
          title={v.nombre}
          aria-pressed={valor === v.id}
          onClick={() => onCambio(v.id)}
          className="group/m grid size-8 place-items-center"
        >
          <span
            aria-hidden="true"
            className={`block rounded-full ${grande ? 'size-[22px]' : 'size-4'} shadow-[inset_0_0_0_1px_rgb(128_120_110/.35)] transition-shadow duration-300 group-aria-pressed/m:shadow-[0_0_0_2px_var(--color-fondo),0_0_0_3px_var(--color-texto)]`}
            style={{ background: MUESTRA[v.id] }}
          />
        </button>
      ))}
    </div>
  );
}

function Tarjeta({
  diseno,
  oculta,
  onVer,
}: {
  diseno: DisenoCatalogo;
  oculta: boolean;
  onVer: (variante: VarianteId) => void;
}) {
  const [variante, setVariante] = useState<VarianteId>('orig');
  const [cambiando, setCambiando] = useState(false);

  function cambiar(v: VarianteId) {
    if (v === variante) return;
    if (reduceMovimiento()) return setVariante(v);
    // Fundido corto: se apaga, cambia el color y vuelve.
    setCambiando(true);
    setTimeout(() => {
      setVariante(v);
      setCambiando(false);
    }, 180);
  }

  return (
    <li hidden={oculta} className="group flex flex-col gap-3.5">
      <div className="relative aspect-[3/4] overflow-hidden bg-superficie shadow-[0_16px_26px_-18px_rgb(11_10_9/.55)]">
        <div
          className={`absolute inset-0 transition-[transform,opacity] duration-[1000ms,400ms] ease-(--ease-suave) group-hover:scale-[1.04] ${cambiando ? 'opacity-0' : ''}`}
        >
          <ImagenDiseno diseno={diseno} variante={variante} />
        </div>
        {/* Atajo con el cursor; con teclado y en el celular se usa el enlace de abajo. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => onVer(variante)}
          className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-[rgb(11_10_9/.9)] p-3 text-[0.8125rem] font-semibold tracking-[0.04em] text-[#fbfaf7] transition-transform duration-[450ms] ease-(--ease-suave) group-hover:translate-y-0 hover:bg-[#0b0a09] sm:block"
        >
          Ver en mi pared
        </button>
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs tracking-[0.08em] text-texto-suave uppercase">
            Referencia · {diseno.categoria}
          </p>
          <h3 className="font-display text-[1.0625rem] leading-tight sm:text-xl">
            {diseno.nombre}
          </h3>
        </div>
        {!diseno.foto && (
          <Muestras
            valor={variante}
            onCambio={cambiar}
            etiqueta={`Probar ${diseno.nombre} en otros colores`}
          />
        )}
      </div>
      <button type="button" onClick={() => onVer(variante)} className="enlace-fuerte self-start">
        Quiero algo así<span className="sr-only">: ver {diseno.nombre} en mi pared</span>
      </button>
    </li>
  );
}

/** Tarjeta grande dentro de la grilla que invita a salirse del catálogo. */
function Invitacion({
  oscura,
  titulo,
  texto,
  boton,
  oculta,
}: {
  oscura: boolean;
  titulo: string;
  texto: string;
  boton: string;
  oculta: boolean;
}) {
  return (
    <li
      hidden={oculta}
      className={`col-span-2 flex flex-col justify-between gap-7 p-[clamp(28px,3.4vw,48px)] ${
        oscura ? 'noche' : 'border border-linea bg-fondo'
      }`}
    >
      <div>
        <h3 className="font-display max-w-[16ch] text-[clamp(1.625rem,2.6vw,2.25rem)]">{titulo}</h3>
        <p className="mt-3.5 max-w-[36ch] text-texto-suave">{texto}</p>
      </div>
      <a
        href="#personalizado"
        className={`boton self-start ${oscura ? 'boton-oro' : 'boton-linea'}`}
      >
        {boton}{' '}
        <span aria-hidden="true" className="flecha">
          →
        </span>
      </a>
    </li>
  );
}

export default function Vitrina() {
  const medidas = useStore($medidas);
  const propia = useStore($imagenPropia);
  const [categoria, setCategoria] = useState('Todos');
  const [disenoId, setDisenoId] = useState(catalogo[0]?.id ?? '');
  const [variante, setVariante] = useState<VarianteId>('orig');
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
  const promocion = describirPromocion(medida.promocion);
  const nombreMaterial = negocio.materiales.find((m) => m.id === material)?.nombre ?? material;
  const mismoPrecio = negocio.materiales.every((m) => m.recargo === 0);

  function irALaPared() {
    document
      .getElementById('pared')
      ?.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => columpiar(colgado.current, 2), reduceMovimiento() ? 0 : 700);
  }

  function elegir(id: string, v: VarianteId) {
    setDisenoId(id);
    setVariante(v);
    setAgregado(null);
    ponerImagenPropia(null);
    irALaPared();
  }

  // Los cuadros del abanico de la portada (fuera de esta isla) son links a #pared con
  // data-diseno: el navegador hace el scroll y aquí solo se elige el diseño.
  useEffect(() => {
    function alTocar(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest<HTMLElement>('[data-diseno]');
      const id = link?.dataset.diseno;
      if (!id || !catalogo.some((d) => d.id === id)) return;
      setDisenoId(id);
      setVariante('orig');
      setAgregado(null);
      ponerImagenPropia(null);
      setTimeout(() => columpiar(colgado.current, 2), reduceMovimiento() ? 0 : 700);
    }
    document.addEventListener('click', alTocar);
    return () => document.removeEventListener('click', alTocar);
  }, []);

  // Cuando el cliente suelta su imagen en la portada, la pared la cuelga y se va hasta allá.
  useEffect(() => {
    if (!propia) return;
    setAgregado(null);
    irALaPared();
  }, [propia]);

  // El cuadro se columpia la primera vez que la pared entra en pantalla.
  useEffect(() => {
    if (!escena.current || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          columpiar(colgado.current, 2);
          o.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    o.observe(escena.current);
    return () => o.disconnect();
  }, []);

  function cambio<T>(set: (v: T) => void, amplitud = 0) {
    return (v: T) => {
      set(v);
      setAgregado(null);
      if (amplitud) setTimeout(() => columpiar(colgado.current, amplitud), 150);
    };
  }

  function agregar() {
    if (!diseno) return;
    const color = variante === 'orig' ? '' : ` en ${nombreVariante(variante).toLowerCase()}`;
    agregarAlCarrito({
      medidaId: medida.id,
      orientacion: 'vertical',
      material,
      cantidad: 1,
      recorte: { x: 0, y: 0, width: 100, height: 100 },
      archivo: `${diseno.nombre}${color}`,
      // SUPUESTO: el arte del catálogo es del taller y está listo para imprimir en cualquier
      // medida, así que la calidad siempre es buena. Las dimensiones son nominales (300 dpi).
      dimensiones: {
        ancho: Math.round((medida.anchoCm / 2.54) * 300),
        alto: Math.round((medida.altoCm / 2.54) * 300),
      },
      dpi: 300,
      calidad: 'buena',
      disenoId: diseno.id,
      ...(variante === 'orig' ? {} : { variante }),
    });
    setAgregado(`${diseno.nombre}${color} en ${etiquetaMedida(medida)} cm, ${nombreMaterial}`);
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
    'width 800ms cubic-bezier(.22,.61,.36,1), margin-left 800ms cubic-bezier(.22,.61,.36,1), bottom 800ms cubic-bezier(.22,.61,.36,1)';

  const nombreColgado = propia ? 'Tu imagen' : diseno.nombre;
  const tipoColgado = propia ? 'Personalizado' : `Referencia · ${diseno.categoria}`;

  const panel = (
    <div className="flex flex-col gap-5 xl:gap-4">
      <div>
        <p className="text-[0.6875rem] tracking-[0.14em] text-texto-suave uppercase">
          {tipoColgado}
        </p>
        <p className="font-display mt-1 text-[1.625rem] leading-tight">{nombreColgado}</p>
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums">{formatearPesos(precio)}</p>
        <p className="mt-0.5 text-xs leading-snug text-texto-suave">
          Precio por cuadro{mismoPrecio ? ', igual en MDF y en acrílico' : ''}.
          {promocion && ` Promoción: ${promocion}.`}
        </p>
      </div>
      {!propia && !diseno.foto && (
        <div>
          <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-texto-suave uppercase">
            Color
          </p>
          <Muestras
            valor={variante}
            onCambio={cambio(setVariante)}
            etiqueta="Color del diseño"
            grande
          />
        </div>
      )}
      <GrupoOpciones
        nombre="vitrina-medida"
        leyenda="Medida (cm)"
        variante="seg"
        columnas="grid-cols-3"
        valor={medida.id}
        onCambio={cambio(setMedidaId, 1.6)}
        opciones={medidas.map((m) => ({ valor: m.id, etiqueta: etiquetaMedida(m) }))}
      />
      <GrupoOpciones
        nombre="vitrina-material"
        leyenda="Acabado"
        variante="seg"
        columnas="grid-cols-2"
        valor={material}
        onCambio={cambio(setMaterial)}
        opciones={negocio.materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
      />
      <GrupoOpciones
        nombre="vitrina-cuarto"
        leyenda="Espacio"
        variante="seg"
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
        variante="seg"
        columnas="grid-cols-2"
        valor={led}
        onCambio={cambio(setLed)}
        opciones={[
          { valor: 'no', etiqueta: 'Luz normal' },
          {
            valor: 'si',
            etiqueta: (
              <>
                <span
                  aria-hidden="true"
                  className={`mr-2 inline-block size-1.5 rounded-full transition-colors ${
                    led === 'si' ? 'bg-led shadow-[0_0_6px_var(--color-led)]' : 'bg-[#5a4f47]'
                  }`}
                />
                LED rojo
              </>
            ),
          },
        ]}
      />
      {propia ? (
        <>
          <a href="/crear" className="boton boton-oro w-full">
            Seguir con mi foto
          </a>
          <p className="-mt-2 text-xs leading-snug text-texto-suave">
            En el configurador la recortas y te decimos si tiene calidad para esa medida.
          </p>
          <button
            type="button"
            onClick={() => ponerImagenPropia(null)}
            className="enlace-fuerte -mt-2 self-start text-texto-suave"
          >
            Volver a los diseños
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={agregar} className="boton boton-oro w-full">
            Agregar al pedido
          </button>
          <div aria-live="polite" className="-mt-2 text-sm empty:hidden">
            {agregado && (
              <p>
                Listo: {agregado} está en tu pedido.{' '}
                <a
                  href="/pedido"
                  className="font-semibold text-acento-fuerte underline underline-offset-4"
                >
                  Ver mi pedido
                </a>
              </p>
            )}
          </div>
          <a href="#personalizado" className="enlace-fuerte -mt-2 self-start text-texto-suave">
            Prefiero ponerle mi imagen
          </a>
        </>
      )}
    </div>
  );

  return (
    <>
      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="scroll-mt-16 border-t border-linea py-[clamp(80px,10vw,136px)]"
      >
        <div className="mx-auto max-w-[1240px] px-4">
          <div className="aparece grid items-end gap-x-[clamp(20px,5vw,80px)] gap-y-4 lg:grid-cols-2">
            <div>
              <p className="antetitulo">Inspiración para tus espacios</p>
              <h2 id="catalogo-titulo" className="titulo-seccion">
                Lo que más nos piden, <span className="text-texto-suave">a tu manera</span>
              </h2>
            </div>
            <p className="max-w-[54ch] text-[1.0625rem] text-texto-suave">
              Estos diseños son referencias, no un catálogo cerrado. Úsalos como punto de partida:
              cambiamos colores, textos y medida, o creamos algo nuevo contigo.
            </p>
          </div>

          <ol className="aparece mt-[clamp(44px,5vw,64px)] grid border-t border-linea md:grid-cols-3">
            {MODOS.map((m, i) => (
              <li
                key={m.titulo}
                className="flex items-baseline gap-4 border-b border-linea py-[18px] md:border-b-0 md:py-0 md:pt-[22px] md:pr-6 md:pb-1 md:[&+&]:border-l md:[&+&]:pl-6"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[22px] leading-none text-acento-fuerte"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{m.titulo}</h3>
                  <p className="mt-0.5 text-sm leading-normal text-texto-suave">{m.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-[clamp(52px,6vw,72px)] flex items-center justify-between gap-3.5 border-b border-linea">
            <div
              role="group"
              aria-label="Filtrar por estilo"
              className="-mb-px flex gap-x-5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:gap-x-[26px] [&::-webkit-scrollbar]:hidden"
            >
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={categoria === c}
                  onClick={() => setCategoria(c)}
                  className="relative min-h-11 shrink-0 text-sm text-texto-suave transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-texto after:transition-transform after:duration-[400ms] hover:text-texto aria-pressed:text-texto aria-pressed:after:scale-x-100"
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="hidden shrink-0 text-[0.8125rem] text-texto-suave md:block">
              Toca los círculos para ver la misma idea en otros colores
            </p>
          </div>

          <ul className="mt-9 grid grid-flow-dense grid-cols-2 gap-x-3.5 gap-y-8 sm:grid-cols-3 sm:gap-x-[clamp(16px,2vw,28px)] sm:gap-y-[clamp(36px,4vw,56px)] lg:grid-cols-4">
            {catalogo.map((d, i) => (
              <Fragment key={d.id}>
                <Tarjeta
                  diseno={d}
                  oculta={categoria !== 'Todos' && d.categoria !== categoria}
                  onVer={(v) => elegir(d.id, v)}
                />
                {i === 4 && (
                  <Invitacion
                    oscura
                    oculta={categoria !== 'Todos'}
                    titulo="¿No ves lo que buscas?"
                    texto="Ninguno de estos diseños es obligatorio. Tráenos tu idea o una imagen y la convertimos en tu cuadro."
                    boton="Crear desde cero"
                  />
                )}
              </Fragment>
            ))}
            <Invitacion
              oscura={false}
              oculta={categoria !== 'Todos'}
              titulo="¿Tienes una foto o un diseño?"
              texto="Súbela y mírala colgada en tu pared en segundos, a escala real."
              boton="Subir mi imagen"
            />
          </ul>
          <p className="mt-8 text-sm text-texto-suave">
            Diseños de ejemplo. Aquí van las fotos reales del catálogo del taller. El precio depende
            de la medida, no del diseño.
          </p>
        </div>
      </section>

      <section
        id="pared"
        aria-labelledby="pared-titulo"
        className="noche scroll-mt-16 py-[clamp(80px,10vw,136px)]"
      >
        <div className="mx-auto max-w-[1240px] px-4">
          <div className="aparece">
            <p className="antetitulo">Ver en tu pared</p>
            <h2 id="pared-titulo" className="titulo-seccion">
              Míralo en tu espacio <span className="text-texto-suave">antes de pedir</span>
            </h2>
          </div>

          <div className="relative mt-[clamp(36px,4vw,52px)]">
            <div
              ref={escena}
              style={estiloEscena}
              className="relative aspect-[4/5] overflow-hidden [--H:300] [--W:240] [--cx:50%] [--u:calc(100cqw/var(--W))] [container-type:inline-size] [background:radial-gradient(ellipse_34%_52%_at_var(--cx)_30%,rgb(255_226_180/.12),transparent_70%),#15120f] sm:aspect-video sm:[--H:225] sm:[--W:400] xl:aspect-[16/10] xl:[--H:250] xl:[--cx:35%]"
            >
              {/* Luz roja del LED sobre la pared. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-[800ms] [background:radial-gradient(ellipse_30%_46%_at_var(--cx)_32%,rgb(255_45_32/.42),transparent_70%)]"
                style={{ opacity: 'var(--led)' }}
              />
              {(Object.keys(MUEBLES) as Cuarto[]).map((k) => {
                const m = MUEBLES[k];
                const visible = k === cuarto;
                return (
                  <div
                    key={k}
                    aria-hidden="true"
                    className="absolute left-(--cx) z-[1] transition-[opacity,transform] duration-[800ms] ease-(--ease-suave)"
                    style={{
                      bottom: cm(PISO_CM),
                      width: cm(m.anchoCm),
                      height: cm(m.altoCm),
                      opacity: visible ? 1 : 0,
                      transform: visible
                        ? 'translateX(-50%)'
                        : `translateX(-50%) translateY(${cm(16)})`,
                    }}
                  >
                    {m.piezas.map((p, i) => (
                      <i
                        key={i}
                        className="absolute block transition-[box-shadow,background-color] duration-[800ms]"
                        style={{
                          left: cm(p.x),
                          bottom: cm(p.y),
                          width: cm(p.w),
                          height: cm(p.h),
                          background: p.led
                            ? `rgb(255 80 60 / calc(.25 + var(--led) * .75))`
                            : p.fondo,
                          boxShadow: p.led
                            ? `0 0 ${cm(8)} ${cm(2)} rgb(255 45 32 / calc(var(--led) * .85))`
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
                className="absolute inset-x-0 bottom-0 border-t border-white/5 bg-[#100e0d]"
                style={{ height: cm(PISO_CM) }}
              />

              {/* El cuadro, colgado de un clavo. */}
              <div
                className="absolute left-(--cx) z-[2]"
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
                    className="absolute -top-7 left-1/2 z-[2] -ml-1 size-2 rounded-full bg-[#8a8078]"
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
                      material === 'acrilico'
                        ? 'sombra-acrilico'
                        : 'shadow-[3px_3px_0_#000,0_24px_40px_-8px_rgb(0_0_0/.6)]'
                    }`}
                    style={{ aspectRatio: `${medida.anchoCm} / ${medida.altoCm}` }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -inset-[6%] -z-10 transition-opacity duration-[800ms]"
                      style={{
                        opacity: 'var(--led)',
                        boxShadow: `0 0 ${cm(14)} ${cm(5)} rgb(255 45 32 / .45)`,
                      }}
                    />
                    {propia ? (
                      <img
                        src={propia.url}
                        alt="Tu imagen colgada en la pared"
                        className="block size-full object-cover"
                      />
                    ) : (
                      <ImagenDiseno diseno={diseno} variante={variante} />
                    )}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-500 [background:linear-gradient(115deg,transparent_38%,rgb(255_255_255/.22)_48%,transparent_58%)] ${
                        material === 'acrilico' ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cota con la medida, debajo del cuadro. */}
              <div
                aria-hidden="true"
                className="absolute left-(--cx) z-[2] flex items-center gap-2 text-[11px] tracking-[0.08em] whitespace-nowrap text-[rgb(243_236_224/.75)] tabular-nums before:h-px before:min-w-1.5 before:flex-1 before:bg-current before:opacity-60 after:h-px after:min-w-1.5 after:flex-1 after:bg-current after:opacity-60"
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
            {/* En el celular van debajo de la escena; en escritorio, encima de ella. */}
            <p className="border-t border-linea bg-superficie px-4 pt-4 text-[0.8125rem] text-texto-suave sm:px-6 xl:absolute xl:top-[6%] xl:left-[3.5%] xl:z-[3] xl:max-w-[26ch] xl:border-0 xl:bg-transparent xl:p-0">
              {mueble.referencia} Todo está a escala real.
            </p>
            <div className="bg-superficie p-4 pt-5 sm:p-6 xl:absolute xl:inset-y-0 xl:right-0 xl:z-[3] xl:w-[min(320px,30%)] xl:overflow-auto xl:border-l xl:border-linea xl:bg-[rgb(11_10_9/.82)] xl:p-6 xl:backdrop-blur-sm">
              {panel}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
