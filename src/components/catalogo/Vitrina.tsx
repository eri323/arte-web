import { useStore } from '@nanostores/react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  negocio,
  type DisenoCatalogo,
  type MaterialId,
  type Orientacion,
} from '../../config/negocio';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { describirPromocion } from '../../lib/precios';
import { dimensionesMedida } from '../../lib/resolucion';
import { agregarAlCarrito } from '../../stores/carrito';
import { $medidas } from '../../stores/precios';
import { $imagenPropia, ponerImagenPropia } from '../../stores/vitrina';
import GrupoOpciones from '../ui/GrupoOpciones';
import ArteCatalogo, { nombreVariante, VARIANTES, type VarianteId } from './ArteCatalogo';

// Catálogo con filtros y la pared donde va el diseño elegido, solo con el cuadro y sus medidas.
// Todo lo que se mide va en centímetros: 1 cm = 100cqw / ancho de la escena, así que el cuadro
// mantiene su tamaño relativo en cualquier pantalla sin medir nada con JS.

const cm = (n: number) => `calc(${n} * var(--u))`;

const catalogo = negocio.catalogo;
const categorias = ['Todos', ...new Set(catalogo.map((d) => d.categoria))];

// La escalera de inspiración: cuántos cuadros se ven a la vez y el titular, palabra por palabra.
const VISIBLES = 5;
const TITULAR: { palabras: string[]; acento?: boolean }[] = [
  { palabras: ['Encuentra', 'inspiración'] },
  { palabras: ['para', 'tu', 'espacio,'], acento: true },
  { palabras: ['a', 'tu', 'manera.'] },
];
/** La forma en que el taller hizo el diseño: las fotos pueden ser horizontales; el arte, vertical. */
const orientacionDe = (d: DisenoCatalogo | undefined): Orientacion =>
  d?.foto?.orientacion ?? 'vertical';
const dosCifras = (n: number) => String(n).padStart(2, '0');
const etiqueta = (categoria: string) => `#${categoria.toLowerCase().replace(/\s+/g, '')}`;

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

/**
 * La imagen del cuadro «se revela» al cambiar de diseño o de color: arranca desenfocada y se
 * enfoca. El desenfoque une el estado viejo y el nuevo, así no se ve un salto entre dos imágenes.
 */
function revelar(el: HTMLElement | null) {
  if (!el || typeof el.animate !== 'function') return;
  const quieto = reduceMovimiento();
  el.animate(
    quieto
      ? [{ opacity: 0.6 }, { opacity: 1 }]
      : [
          { opacity: 0.5, filter: 'blur(6px)', transform: 'scale(0.985)' },
          { opacity: 1, filter: 'blur(0)', transform: 'none' },
        ],
    { duration: quieto ? 150 : 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  );
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
  cargar = 'lazy',
  sizes = '(min-width: 1024px) 260px, 45vw',
}: {
  diseno: DisenoCatalogo;
  decorativa?: boolean;
  variante?: VarianteId;
  /** En la portada las fotos se ven de una: ahí van con 'eager'. */
  cargar?: 'lazy' | 'eager';
  /** Qué tan ancha se ve la foto, para que el navegador baje el tamaño justo. */
  sizes?: string;
}) {
  // Con foto real del taller no hay variantes de color: se muestra la foto tal cual.
  if (diseno.foto) {
    return (
      <img
        src={diseno.foto.src}
        srcSet={
          diseno.foto.srcGrande
            ? `${diseno.foto.src} 800w, ${diseno.foto.srcGrande} 1600w`
            : undefined
        }
        sizes={diseno.foto.srcGrande ? sizes : undefined}
        alt={decorativa ? '' : diseno.foto.alt}
        loading={cargar}
        decoding="async"
        className="block size-full object-cover"
        style={diseno.foto.posicion ? { objectPosition: diseno.foto.posicion } : undefined}
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
          className="group/m presionable grid size-8 place-items-center"
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
  const [orientacion, setOrientacion] = useState<Orientacion>(orientacionDe(catalogo[0]));
  const [led, setLed] = useState<'si' | 'no'>('si');
  const [agregado, setAgregado] = useState<string | null>(null);
  const imagenColgada = useRef<HTMLDivElement>(null);
  const filtros = useRef<HTMLDivElement>(null);
  const raya = useRef<HTMLSpanElement>(null);
  const primeraVez = useRef(true);
  const [recienAgregado, setRecienAgregado] = useState(false);
  // La escalera: qué cuadro va al frente y el color elegido para cada diseño.
  const [inicio, setInicio] = useState(0);
  const [colores, setColores] = useState<Record<string, VarianteId>>({});
  const [cambiando, setCambiando] = useState(false);

  // La raya de los filtros se mueve (no aparece y desaparece): se ve de dónde viene y a dónde va.
  useLayoutEffect(() => {
    const grupo = filtros.current;
    const r = raya.current;
    if (!grupo || !r) return;
    const colocar = (animar: boolean) => {
      const activo = grupo.querySelector<HTMLElement>(
        `[data-categoria="${CSS.escape(categoria)}"]`,
      );
      if (!activo) return;
      r.style.transition =
        animar && !reduceMovimiento() ? 'transform 350ms cubic-bezier(0.77, 0, 0.175, 1)' : 'none';
      r.style.transform = `translateX(${activo.offsetLeft}px) scaleX(${activo.offsetWidth})`;
    };
    colocar(!primeraVez.current);
    const alCambiarTamano = () => colocar(false);
    window.addEventListener('resize', alCambiarTamano);
    return () => window.removeEventListener('resize', alCambiarTamano);
  }, [categoria]);

  // Cada vez que cambia lo que cuelga en la pared (diseño, color o imagen propia), se revela.
  useEffect(() => {
    if (primeraVez.current) return;
    revelar(imagenColgada.current);
  }, [disenoId, variante, propia?.url]);

  useEffect(() => {
    primeraVez.current = false;
  }, []);

  // «Agregado» se queda un momento en el botón y vuelve a «Agregar al pedido».
  useEffect(() => {
    if (!recienAgregado) return;
    const t = setTimeout(() => setRecienAgregado(false), 1600);
    return () => clearTimeout(t);
  }, [recienAgregado]);

  const diseno = catalogo.find((d) => d.id === disenoId) ?? catalogo[0];
  const medida = medidas.find((m) => m.id === medidaId) ?? medidas[0]!;
  const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
  const medidaCuadro = etiquetaMedida(medida, orientacion);
  const precio = usePrecioAnimado(medida.precio);
  const promocion = describirPromocion(medida.promocion);
  const nombreMaterial = negocio.materiales.find((m) => m.id === material)?.nombre ?? material;
  const mismoPrecio = negocio.materiales.every((m) => m.recargo === 0);

  function irALaPared() {
    document
      .getElementById('pared')
      ?.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'start' });
  }

  function elegir(id: string, v: VarianteId) {
    setDisenoId(id);
    setVariante(v);
    setOrientacion(orientacionDe(catalogo.find((d) => d.id === id)));
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
      setOrientacion(orientacionDe(catalogo.find((d) => d.id === id)));
      setAgregado(null);
      ponerImagenPropia(null);
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

  function cambio<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setAgregado(null);
    };
  }

  function agregar() {
    if (!diseno) return;
    const color = variante === 'orig' ? '' : ` en ${nombreVariante(variante).toLowerCase()}`;
    agregarAlCarrito({
      medidaId: medida.id,
      orientacion,
      material,
      cantidad: 1,
      recorte: { x: 0, y: 0, width: 100, height: 100 },
      archivo: `${diseno.nombre}${color}`,
      // SUPUESTO: el arte del catálogo es del taller y está listo para imprimir en cualquier
      // medida, así que la calidad siempre es buena. Las dimensiones son nominales (300 dpi).
      dimensiones: {
        ancho: Math.round((anchoCm / 2.54) * 300),
        alto: Math.round((altoCm / 2.54) * 300),
      },
      dpi: 300,
      calidad: 'buena',
      disenoId: diseno.id,
      ...(variante === 'orig' ? {} : { variante }),
    });
    const enHorizontal = orientacion === 'horizontal' ? ', horizontal' : '';
    setAgregado(`${diseno.nombre}${color} en ${medidaCuadro} cm${enHorizontal}, ${nombreMaterial}`);
    setRecienAgregado(true);
  }

  const lista =
    categoria === 'Todos' ? catalogo : catalogo.filter((d) => d.categoria === categoria);
  const frente = lista[inicio] ?? lista[0];
  const colorFrente: VarianteId = (frente && colores[frente.id]) ?? 'orig';

  function filtrar(c: string) {
    setCategoria(c);
    setInicio(0);
  }

  function mover(paso: number) {
    setInicio((i) => Math.min(Math.max(i + paso, 0), lista.length - 1));
  }

  function cambiarColor(v: VarianteId) {
    if (!frente || v === colorFrente) return;
    const id = frente.id;
    const poner = () => setColores((m) => ({ ...m, [id]: v }));
    if (reduceMovimiento()) return poner();
    // Se desenfoca, cambia el color y se vuelve a enfocar: se lee como un solo cuadro que cambia.
    setCambiando(true);
    setTimeout(() => {
      poner();
      setCambiando(false);
    }, 160);
  }

  if (!diseno || !frente) return null;

  const estiloEscena = {
    '--cmw': anchoCm,
    '--cmh': altoCm,
    '--led': led === 'si' ? 1 : 0,
  } as CSSProperties;
  // El cuadro va centrado en la pared.
  const abajo = `calc((var(--H) - var(--cmh)) / 2 * var(--u))`;
  const curva = '800ms cubic-bezier(.22,.61,.36,1)';
  const transicionLado = `left ${curva}, height ${curva}, bottom ${curva}`;
  const transicion =
    'width 800ms cubic-bezier(.22,.61,.36,1), height 800ms cubic-bezier(.22,.61,.36,1), margin-left 800ms cubic-bezier(.22,.61,.36,1), bottom 800ms cubic-bezier(.22,.61,.36,1)';

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
        onCambio={cambio(setMedidaId)}
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
        nombre="vitrina-orientacion"
        leyenda="Orientación"
        variante="seg"
        columnas="grid-cols-2"
        valor={orientacion}
        onCambio={cambio(setOrientacion)}
        opciones={negocio.orientaciones.map((o) => ({
          valor: o,
          etiqueta: o === 'vertical' ? 'Vertical' : 'Horizontal',
        }))}
      />
      {orientacion !== orientacionDe(diseno) && !propia && (
        // SUPUESTO: cada diseño se hace en una orientación; en la otra el taller lo adapta, así que
        // la pared muestra un recorte solo como referencia del tamaño.
        <p className="-mt-3 text-xs leading-snug text-texto-suave">
          Este diseño es {orientacionDe(diseno)}: en {orientacion} lo adaptamos a la nueva forma.
          Aquí ves un recorte de referencia.
        </p>
      )}
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
          <a
            href={`/crear?${new URLSearchParams({ medida: medida.id, orientacion, material })}`}
            className="boton boton-oro w-full"
          >
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
          {/* Las dos etiquetas ocupan la misma celda y se cruzan con un desenfoque corto. */}
          <button
            type="button"
            onClick={agregar}
            aria-label={recienAgregado ? 'Agregado al pedido' : 'Agregar al pedido'}
            className="boton boton-oro grid w-full"
          >
            <span
              aria-hidden="true"
              className={`[grid-area:1/1] transition-[opacity,filter,transform] duration-200 ease-(--ease-out) ${
                recienAgregado ? 'translate-y-1 opacity-0 blur-[2px]' : ''
              }`}
            >
              Agregar al pedido
            </span>
            <span
              aria-hidden="true"
              className={`[grid-area:1/1] transition-[opacity,filter,transform] duration-200 ease-(--ease-out) ${
                recienAgregado ? '' : '-translate-y-1 opacity-0 blur-[2px]'
              }`}
            >
              Agregado ✓
            </span>
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
      {/* Inspiración: el texto a la izquierda y los cuadros en escalera a la derecha, que se
          abren desde un mazo al entrar en pantalla (Base.astro pone .visto). El cuadro del frente
          es el que se describe abajo, cambia de color y se cuelga en la pared. */}
      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="scroll-mt-16 overflow-x-clip border-t border-linea py-[clamp(72px,9vw,128px)]"
      >
        <div className="aparece escalera mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-x-[clamp(32px,4vw,64px)] gap-y-12 px-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
          <div className="max-w-[460px]">
            <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-texto-suave uppercase">
              Nuestros cuadros más pedidos
            </p>
            <h2
              id="catalogo-titulo"
              className="font-display mt-4 text-[clamp(2.125rem,3.8vw,3.375rem)] leading-[1.04]"
            >
              {(() => {
                let w = 0;
                return TITULAR.map((linea, l) => (
                  <span key={l} className={`block ${linea.acento ? 'text-acento-fuerte' : ''}`}>
                    {linea.palabras.map((p, k) => (
                      <span key={p + k}>
                        <span className="palabra" style={{ '--w': w++ } as CSSProperties}>
                          {p}
                        </span>
                        {k < linea.palabras.length - 1 && ' '}
                      </span>
                    ))}{' '}
                  </span>
                ));
              })()}
            </h2>
            <p className="mt-5 max-w-[40ch] text-[0.9375rem] leading-relaxed text-texto-suave">
              Son referencias, no un catálogo cerrado. Te lo hacemos tal cual, lo adaptamos a tu
              espacio o lo diseñamos contigo desde cero.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => elegir(frente.id, colorFrente)}
                aria-label={`Ver en mi pared: ${frente.nombre}`}
                className="boton boton-negro"
              >
                Ver en mi pared
              </button>
              <a href="#personalizado" className="boton boton-linea">
                Crear desde cero
              </a>
            </div>

            <div
              ref={filtros}
              role="group"
              aria-label="Filtrar por estilo"
              className="relative mt-10 -mb-px flex gap-x-4 overflow-x-auto border-b border-linea [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-categoria={c}
                  aria-pressed={categoria === c}
                  onClick={() => filtrar(c)}
                  className="min-h-11 shrink-0 text-sm text-texto-suave transition-colors duration-200 hover:text-texto aria-pressed:text-texto"
                >
                  {c}
                </button>
              ))}
              {/* Una sola raya que se desliza hasta el filtro elegido. */}
              <span
                ref={raya}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-px w-px origin-left bg-texto"
              />
            </div>
            <p className="mt-4 text-xs leading-snug text-texto-suave">
              Fotos reales de cuadros del taller. Cualquiera se hace en tu medida; el precio depende
              de la medida, no del diseño.
            </p>
          </div>

          <div className="relative h-[calc(var(--cw)*1.3333+var(--dy)+176px)] [--cw:clamp(138px,40vw,200px)] [--dx:calc(var(--cw)*0.55)] [--dy:calc(var(--cw)*0.16)] md:[--cw:clamp(200px,26vw,240px)] md:[--dx:calc(var(--cw)*0.62)] md:[--dy:calc(var(--cw)*0.18)] lg:[--cw:clamp(180px,17vw,260px)] lg:[--dx:calc(var(--cw)*0.64)] lg:[--dy:calc(var(--cw)*0.2)]">
            <ul aria-label="Diseños de referencia" className="absolute inset-0">
              {catalogo.map((d) => {
                const k = lista.indexOf(d);
                const lugar = k < 0 ? VISIBLES : k - inicio;
                const visible = k >= 0 && lugar >= 0 && lugar < VISIBLES;
                const s = Math.max(-1, Math.min(lugar, VISIBLES));
                const color = colores[d.id] ?? 'orig';
                return (
                  <li
                    key={d.id}
                    aria-hidden={!visible}
                    className={`esc-item ${visible ? '' : 'fuera'}`}
                    style={{ '--s': s, zIndex: s < 0 ? 0 : VISIBLES + 1 - s } as CSSProperties}
                  >
                    {/* Atajo con el mouse: el del frente va a la pared y los demás pasan al
                        frente. Con teclado se usan las flechas y el botón «Ver en mi pared». */}
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden="true"
                      onClick={() => (s === 0 ? elegir(d.id, color) : setInicio(k))}
                      className="esc-arte block aspect-[3/4] w-full overflow-hidden rounded-[14px] bg-superficie"
                    >
                      <span
                        className={`block size-full transition-[opacity,filter] duration-150 ${
                          s === 0 && cambiando ? 'opacity-40 blur-[3px]' : ''
                        }`}
                      >
                        <ImagenDiseno diseno={d} variante={color} decorativa />
                      </span>
                    </button>
                    <span className="sr-only">{d.nombre}</span>
                    <span
                      aria-hidden="true"
                      className={`burbuja esc-burbuja ${
                        s === 2
                          ? 'right-3 bg-texto after:right-5'
                          : 'left-3 bg-[#e3b54a] after:left-5'
                      } ${visible && (s === 0 || s === 2) ? '' : 'oculta'}`}
                      style={s === 2 ? { color: 'var(--color-fondo)' } : undefined}
                    >
                      {etiqueta(d.categoria)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="absolute top-[calc(var(--cw)*1.3333+var(--dy)+16px)] left-0 w-[calc(var(--dx)*2-12px)]">
              <p className="text-xs text-texto-suave tabular-nums">
                {dosCifras(inicio + 1)} / {dosCifras(lista.length)}
              </p>
              <div aria-live="polite">
                <h3 className="font-editorial mt-1 text-xl leading-tight">{frente.nombre}</h3>
                <p className="mt-0.5 text-xs text-texto-suave">Referencia · {frente.categoria}</p>
              </div>
              {!frente.foto && (
                <div className="mt-2.5">
                  <Muestras
                    valor={colorFrente}
                    onCambio={cambiarColor}
                    etiqueta={`Probar ${frente.nombre} en otros colores`}
                  />
                </div>
              )}
            </div>

            <div className="absolute right-0 bottom-0 z-20 flex gap-1.5 lg:top-0 lg:bottom-auto lg:flex-col">
              {[
                { paso: -1, nombre: 'Diseño anterior', d: 'M15 6l-6 6 6 6' },
                { paso: 1, nombre: 'Siguiente diseño', d: 'M9 6l6 6-6 6' },
              ].map((f) => (
                <button
                  key={f.paso}
                  type="button"
                  aria-label={f.nombre}
                  disabled={f.paso < 0 ? inicio === 0 : inicio >= lista.length - 1}
                  onClick={() => mover(f.paso)}
                  className="presionable grid size-11 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-texto)_6%,var(--color-fondo))] text-texto transition-[background-color,opacity] duration-200 hover:bg-[color-mix(in_srgb,var(--color-texto)_12%,var(--color-fondo))] disabled:pointer-events-none disabled:opacity-30"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-4 lg:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={f.d} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="pared"
        aria-labelledby="pared-titulo"
        className="scroll-mt-16 px-4 pb-[clamp(80px,10vw,136px)]"
      >
        <div className="noche mx-auto max-w-[1240px] rounded-[24px] px-4 py-[clamp(48px,7vw,96px)] sm:px-[clamp(24px,4vw,56px)]">
          <div className="aparece">
            <p className="antetitulo">Ver en tu pared</p>
            <h2 id="pared-titulo" className="titulo-seccion">
              Míralo en tu espacio <span className="text-texto-suave">antes de pedir</span>
            </h2>
          </div>

          <div className="relative mt-[clamp(32px,4vw,48px)] overflow-hidden rounded-[16px]">
            <div
              style={estiloEscena}
              className="relative aspect-[4/5] overflow-hidden [--H:250] [--W:200] [--cx:50%] [--u:calc(100cqw/var(--W))] [container-type:inline-size] [background:radial-gradient(ellipse_34%_52%_at_var(--cx)_50%,rgb(255_226_180/.12),transparent_70%),#15120f] sm:aspect-video sm:[--H:191] sm:[--W:340] xl:aspect-[3/2] xl:[--H:227] xl:[--cx:35%]"
            >
              {/* Luz roja del LED sobre la pared. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-[800ms] [background:radial-gradient(ellipse_30%_46%_at_var(--cx)_50%,rgb(255_45_32/.42),transparent_70%)]"
                style={{ opacity: 'var(--led)' }}
              />
              {/* El cuadro, montado directo sobre la pared. */}
              <div
                className="absolute left-(--cx) z-[2]"
                style={{
                  width: cm(anchoCm),
                  height: cm(altoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: abajo,
                  transition: transicion,
                }}
              >
                <div className="relative size-full">
                  <div
                    className={`relative size-full bg-black transition-shadow duration-500 ${
                      material === 'acrilico'
                        ? 'sombra-acrilico'
                        : 'shadow-[3px_3px_0_#000,0_24px_40px_-8px_rgb(0_0_0/.6)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 transition-opacity duration-[800ms]"
                      style={{
                        opacity: 'var(--led)',
                        boxShadow: `0 0 ${cm(22)} ${cm(1)} rgb(255 45 32 / .4)`,
                      }}
                    />
                    <div ref={imagenColgada} className="size-full">
                      {propia ? (
                        <img
                          src={propia.url}
                          alt="Tu imagen colgada en la pared"
                          className="block size-full object-cover"
                        />
                      ) : (
                        <ImagenDiseno
                          diseno={diseno}
                          variante={variante}
                          sizes="(min-width: 1280px) 640px, 92vw"
                        />
                      )}
                    </div>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-500 [background:linear-gradient(115deg,transparent_38%,rgb(255_255_255/.22)_48%,transparent_58%)] ${
                        material === 'acrilico' ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cotas como en un plano: el ancho debajo del cuadro y el alto a su derecha. */}
              <div
                aria-hidden="true"
                data-cota="ancho"
                className="absolute left-(--cx) z-[2] flex items-center gap-2 text-[11px] tracking-[0.08em] whitespace-nowrap text-[rgb(243_236_224/.75)] tabular-nums before:h-px before:min-w-1.5 before:flex-1 before:bg-current before:opacity-60 after:h-px after:min-w-1.5 after:flex-1 after:bg-current after:opacity-60"
                style={{
                  width: cm(anchoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: `calc(${abajo} - 26px)`,
                  transition: transicion,
                }}
              >
                {anchoCm} cm
              </div>
              <div
                aria-hidden="true"
                data-cota="alto"
                className="absolute z-[2] flex flex-col items-center gap-2 text-[11px] tracking-[0.08em] whitespace-nowrap text-[rgb(243_236_224/.75)] tabular-nums before:w-px before:min-h-1.5 before:flex-1 before:bg-current before:opacity-60 after:w-px after:min-h-1.5 after:flex-1 after:bg-current after:opacity-60"
                style={{
                  left: `calc(var(--cx) + var(--cmw) * var(--u) * 0.5 + 12px)`,
                  height: cm(altoCm),
                  bottom: abajo,
                  transition: transicionLado,
                }}
              >
                <span className="rotate-180 [writing-mode:vertical-rl]">{altoCm} cm</span>
              </div>
            </div>
            {/* En el celular van debajo de la escena; en escritorio, encima de ella. */}
            <p className="border-t border-linea bg-superficie px-4 pt-4 text-[0.8125rem] text-texto-suave sm:px-6 xl:absolute xl:top-[6%] xl:left-[3.5%] xl:z-[3] xl:max-w-[26ch] xl:border-0 xl:bg-transparent xl:p-0">
              Todo está a escala real: el ancho va debajo del cuadro y el alto, al lado.
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
