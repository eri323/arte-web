import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { negocio, type DisenoCatalogo, type Medida } from '../../config/negocio';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { dimensionesMedida } from '../../lib/resolucion';
import { agregarAlCarrito } from '../../stores/carrito';
import { $medidas } from '../../stores/precios';
import GrupoOpciones from '../ui/GrupoOpciones';
import Poster, { formaDe } from './Poster';

// El catálogo con filtros y la pared donde se cuelga el póster elegido, a escala. Todo lo que se
// mide va en centímetros: 1 cm = 100cqw / ancho de la escena, así el cuadro mantiene su tamaño
// relativo en cualquier pantalla sin medir nada con JS.

const cm = (n: number) => `calc(${n} * var(--u))`;

const catalogo = negocio.catalogo;
const categorias = ['Todos', ...new Set(catalogo.map((d) => d.categoria))];

// El escenario cambia con el tamaño del póster, como en las fotos del taller: los pequeños se
// ven de cerca, apoyados sobre un escritorio; los medianos, colgados sobre una mesa; los grandes,
// sobre un sofá. Así un 13×18 no queda como un punto en una pared pensada para un 70×100.
// `anchoCelular` y `anchoEscritorio` son los centímetros de pared que caben a lo ancho de la
// escena; `baseCm` es la altura a la que queda el borde de abajo del póster.
type EscenaId = 'escritorio' | 'mesa' | 'sofa';
const ESCENAS: Record<EscenaId, { anchoCelular: number; anchoEscritorio: number; baseCm: number }> =
  {
    escritorio: { anchoCelular: 80, anchoEscritorio: 110, baseCm: 16 },
    mesa: { anchoCelular: 170, anchoEscritorio: 290, baseCm: 88 },
    sofa: { anchoCelular: 230, anchoEscritorio: 365, baseCm: 106 },
  };

// SUPUESTO: los cortes entre escenarios (hasta 50 cm de lado mayor y menos de 35 de lado menor
// va al escritorio; hasta 70 cm, sobre la mesa; lo demás, sobre el sofá) los puso la demo.
function escenaPara(anchoCm: number, altoCm: number): EscenaId {
  const mayor = Math.max(anchoCm, altoCm);
  const menor = Math.min(anchoCm, altoCm);
  if (mayor <= 50 && menor < 35) return 'escritorio';
  return mayor <= 70 ? 'mesa' : 'sofa';
}

const etiquetaMueble = 'text-center text-[11px] font-medium whitespace-nowrap';

/** Las medidas del catálogo que le sirven a un diseño: los panorámicos solo van en alargadas. */
function medidasPara(medidas: Medida[], diseno: DisenoCatalogo | undefined): Medida[] {
  const panoramico = formaDe(diseno) === 'panoramico';
  return medidas.filter((m) => m.linea === 'catalogo' && Boolean(m.panoramica) === panoramico);
}

// SUPUESTO: la pared arranca en 35×50 con acrílico (la medida mediana del catálogo) y los
// panorámicos en 20×50, porque el taller no dice cuál es la más pedida.
const MEDIDA_INICIAL = { normal: '35x50-acrilico', panoramico: '20x50' };

function reduceMovimiento(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
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
      const p = Math.min((t - inicio) / 450, 1);
      const e = 1 - (1 - p) ** 3;
      // Los precios van en miles: la cifra corre de mil en mil para no mostrar pesos sueltos.
      setMostrado(Math.round((desde + (valor - desde) * e) / 1000) * 1000);
      if (p < 1) raf = requestAnimationFrame(paso);
      else setMostrado(valor);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return mostrado;
}

export default function Vitrina() {
  const medidas = useStore($medidas);
  const [categoria, setCategoria] = useState('Todos');
  const [disenoId, setDisenoId] = useState(catalogo[0]?.id ?? '');
  const [medidaId, setMedidaId] = useState(MEDIDA_INICIAL.normal);
  const [agregado, setAgregado] = useState<string | null>(null);
  const [recienAgregado, setRecienAgregado] = useState(false);

  const diseno = catalogo.find((d) => d.id === disenoId) ?? catalogo[0];
  const disponibles = medidasPara(medidas, diseno);
  const medida = disponibles.find((m) => m.id === medidaId) ?? disponibles[0] ?? medidas[0]!;
  const orientacion = formaDe(diseno) === 'vertical' ? 'vertical' : 'horizontal';
  const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
  const medidaCuadro = etiquetaMedida(medida, orientacion);
  const precio = usePrecioAnimado(medida.precio);
  const frontal = negocio.materiales.find((m) => m.id === medida.frontal);
  const desde = Math.min(...medidas.filter((m) => m.linea === 'catalogo').map((m) => m.precio));

  function elegir(id: string, irAPared = true) {
    const nuevo = catalogo.find((d) => d.id === id);
    if (!nuevo) return;
    setDisenoId(id);
    setAgregado(null);
    // Al pasar de un póster normal a uno panorámico (o al revés) la medida anterior ya no existe.
    if ((formaDe(nuevo) === 'panoramico') !== (formaDe(diseno) === 'panoramico')) {
      setMedidaId(
        formaDe(nuevo) === 'panoramico' ? MEDIDA_INICIAL.panoramico : MEDIDA_INICIAL.normal,
      );
    }
    if (irAPared) {
      document
        .getElementById('pared')
        ?.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'start' });
    }
  }
  const elegirRef = useRef(elegir);
  elegirRef.current = elegir;

  // Los pósters de la portada (fuera de esta isla) son links a #pared con data-diseno: el
  // navegador hace el scroll y aquí solo se elige el diseño.
  useEffect(() => {
    function alTocar(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest<HTMLElement>('a[data-diseno]');
      if (link?.dataset.diseno) elegirRef.current(link.dataset.diseno, false);
    }
    document.addEventListener('click', alTocar);
    return () => document.removeEventListener('click', alTocar);
  }, []);

  // «Agregado» se queda un momento en el botón y vuelve a «Agregar al pedido».
  useEffect(() => {
    if (!recienAgregado) return;
    const t = setTimeout(() => setRecienAgregado(false), 1600);
    return () => clearTimeout(t);
  }, [recienAgregado]);

  function agregar() {
    if (!diseno) return;
    agregarAlCarrito({
      medidaId: medida.id,
      orientacion,
      material: medida.frontal,
      cantidad: 1,
      recorte: { x: 0, y: 0, width: 100, height: 100 },
      archivo: diseno.nombre,
      // SUPUESTO: el arte del catálogo es del taller y está listo para imprimir en cualquier
      // medida, así que la calidad siempre es buena. Las dimensiones son nominales (300 dpi).
      dimensiones: {
        ancho: Math.round((anchoCm / 2.54) * 300),
        alto: Math.round((altoCm / 2.54) * 300),
      },
      dpi: 300,
      calidad: 'buena',
      disenoId: diseno.id,
    });
    setAgregado(`${diseno.nombre} en ${medidaCuadro} cm`);
    setRecienAgregado(true);
  }

  if (!diseno) return null;

  const lista =
    categoria === 'Todos' ? catalogo : catalogo.filter((d) => d.categoria === categoria);

  const escenaId = escenaPara(anchoCm, altoCm);
  const escena = ESCENAS[escenaId];
  const estiloEscena = {
    '--cmw': anchoCm,
    '--cmh': altoCm,
    // En celular el escritorio se acerca todavía más a los pósters angostos: el pocillo crece
    // con ellos, así que la escala se sigue leyendo.
    '--Wm': escenaId === 'escritorio' ? Math.max(54, anchoCm + 36) : escena.anchoCelular,
    '--Wd': escena.anchoEscritorio,
  } as CSSProperties;
  const abajo = cm(escena.baseCm);
  const curva = '700ms cubic-bezier(.22,.61,.36,1)';
  const transicion = `width ${curva}, height ${curva}, margin-left ${curva}`;
  const cota =
    'absolute z-[2] flex items-center gap-2 text-[11px] font-medium whitespace-nowrap text-[#55565a] tabular-nums';

  return (
    <>
      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="scroll-mt-16 py-[clamp(72px,9vw,128px)]"
      >
        <div className="mx-auto max-w-[1240px] px-4">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h2 id="catalogo-titulo" className="titulo-seccion">
              Catálogo
            </h2>
            <p className="max-w-[46ch] text-[0.9375rem] text-texto-suave">
              Cada póster llega enmarcado y listo para colgar, desde {formatearPesos(desde)}. Toca
              uno para verlo a escala y elegir la medida.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtrar por categoría"
            className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className="presionable min-h-11 shrink-0 rounded-[4px] border border-linea-fuerte px-4 text-sm font-medium text-texto-suave transition-colors duration-200 hover:border-texto hover:text-texto aria-pressed:border-texto aria-pressed:bg-texto aria-pressed:text-fondo"
              >
                {c}
              </button>
            ))}
          </div>

          <ul
            aria-label="Pósters del catálogo"
            className="mt-10 grid grid-cols-2 items-end gap-x-[clamp(16px,3vw,40px)] gap-y-[clamp(36px,5vw,64px)] md:grid-cols-3 lg:grid-cols-4"
          >
            {lista.map((d) => (
              <li key={d.id} className={formaDe(d) === 'panoramico' ? 'col-span-2' : ''}>
                <button
                  type="button"
                  onClick={() => elegir(d.id)}
                  className="tarjeta-poster group block w-full text-left"
                >
                  <Poster diseno={d} decorativa />
                  <span className="sr-only">Ver a escala: </span>
                  <span className="mt-4 block text-[0.9375rem] leading-snug font-semibold">
                    {d.nombre}
                  </span>
                  <span className="block text-[0.8125rem] text-texto-suave">{d.categoria}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="pared"
        aria-labelledby="pared-titulo"
        className="scroll-mt-16 border-t border-linea py-[clamp(72px,9vw,128px)]"
      >
        <div className="mx-auto max-w-[1240px] px-4">
          <h2 id="pared-titulo" className="titulo-seccion">
            Míralo a escala
          </h2>

          <div className="mt-[clamp(28px,4vw,44px)] grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
            <div
              style={estiloEscena}
              data-escena={escenaId}
              className="relative aspect-[5/6] overflow-hidden rounded-[6px] [--W:var(--Wm)] [--u:calc(100cqw/var(--W))] [container-type:inline-size] [background:radial-gradient(ellipse_70%_60%_at_50%_38%,#fbfbf9,#e9e9e5_75%)] sm:aspect-[16/10] sm:[--W:var(--Wd)]"
            >
              {/* El mueble de referencia: da la escala de un vistazo y cambia con el tamaño. */}
              {escenaId === 'escritorio' && (
                <div aria-hidden="true" key="escritorio" className="mueble absolute inset-0">
                  <div
                    className="absolute inset-x-0 bottom-0 bg-[#9a7650]"
                    style={{ height: cm(16) }}
                  >
                    <span className="absolute inset-x-0 top-0 block h-[14%] bg-[#b89268]" />
                  </div>
                  {/* Un pocillo de 10 cm al lado del póster. */}
                  <div
                    className="absolute"
                    style={{
                      width: cm(8),
                      height: cm(10),
                      bottom: cm(16),
                      left: `calc(50% - var(--cmw) * var(--u) * 0.5 - 15 * var(--u))`,
                      transition: `left ${curva}`,
                    }}
                  >
                    <span className="absolute inset-0 block rounded-b-[18%] bg-[#dedcd6] shadow-[inset_-0.4em_0_0.6em_#0001]" />
                    <span
                      className="absolute top-[22%] block rounded-full border-[#dedcd6]"
                      style={{
                        right: '100%',
                        width: cm(3.4),
                        height: cm(5),
                        borderWidth: cm(1),
                        borderRightWidth: 0,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                    />
                    <span
                      className={`${etiquetaMueble} absolute left-1/2 -translate-x-1/2 text-[#2a1d10]`}
                      style={{ top: `calc(100% + ${cm(5)})` }}
                    >
                      pocillo de 10 cm
                    </span>
                  </div>
                </div>
              )}
              {escenaId === 'mesa' && (
                <div aria-hidden="true" key="mesa" className="mueble absolute inset-0">
                  <div
                    className="absolute inset-x-0 bottom-0 bg-[#d6d5d0]"
                    style={{ height: cm(6) }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ width: cm(120), height: cm(72), bottom: cm(6) }}
                  >
                    <span
                      className="absolute inset-x-0 top-0 block bg-[#2b2c30]"
                      style={{ height: cm(5) }}
                    />
                    <span
                      className="absolute top-0 left-[4%] block h-full bg-[#2b2c30]"
                      style={{ width: cm(3) }}
                    />
                    <span
                      className="absolute top-0 right-[4%] block h-full bg-[#2b2c30]"
                      style={{ width: cm(3) }}
                    />
                    <span
                      className={`${etiquetaMueble} absolute inset-x-0 top-[38%] text-[#55565a]`}
                    >
                      mesa de 120 cm
                    </span>
                  </div>
                </div>
              )}
              {escenaId === 'sofa' && (
                <div aria-hidden="true" key="sofa" className="mueble absolute inset-0">
                  <div
                    className="absolute inset-x-0 bottom-0 bg-[#d6d5d0]"
                    style={{ height: cm(6) }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ width: cm(200), height: cm(80), bottom: cm(6) }}
                  >
                    {/* Patas, espaldar, brazos y asiento. */}
                    <span
                      className="absolute bottom-0 left-[6%] block bg-[#1c1d20]"
                      style={{ width: cm(4), height: cm(8) }}
                    />
                    <span
                      className="absolute right-[6%] bottom-0 block bg-[#1c1d20]"
                      style={{ width: cm(4), height: cm(8) }}
                    />
                    <span
                      className="absolute inset-x-[5%] top-0 block rounded-t-[1.2em] bg-[#3a3b40]"
                      style={{ bottom: cm(8) }}
                    />
                    <span
                      className="absolute left-0 block rounded-t-[1em] bg-[#2b2c30]"
                      style={{ width: cm(22), height: cm(52), bottom: cm(8) }}
                    />
                    <span
                      className="absolute right-0 block rounded-t-[1em] bg-[#2b2c30]"
                      style={{ width: cm(22), height: cm(52), bottom: cm(8) }}
                    />
                    <span
                      className={`${etiquetaMueble} absolute inset-x-[11%] grid place-items-center rounded-t-[0.6em] bg-[#2b2c30] text-[#d9d9d6]`}
                      style={{ height: cm(34), bottom: cm(8) }}
                    >
                      sofá de 200 cm
                    </span>
                  </div>
                </div>
              )}

              {/* El póster, a escala. */}
              <div
                className="absolute left-1/2 z-[2]"
                style={{
                  width: cm(anchoCm),
                  height: cm(altoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: abajo,
                  transition: transicion,
                }}
              >
                <Poster key={diseno.id} diseno={diseno} llenar cargar="eager" />
              </div>

              {/* Cotas como en un plano: el ancho encima del cuadro y el alto a su derecha. */}
              <div
                aria-hidden="true"
                data-cota="ancho"
                className={`${cota} left-1/2 before:h-px before:min-w-1.5 before:flex-1 before:bg-current before:opacity-60 after:h-px after:min-w-1.5 after:flex-1 after:bg-current after:opacity-60`}
                style={{
                  width: cm(anchoCm),
                  marginLeft: `calc(var(--cmw) * var(--u) * -0.5)`,
                  bottom: `calc(${abajo} + var(--cmh) * var(--u) + 8px)`,
                  transition: `${transicion}, bottom ${curva}`,
                }}
              >
                {anchoCm} cm
              </div>
              <div
                aria-hidden="true"
                data-cota="alto"
                className={`${cota} flex-col before:min-h-1.5 before:w-px before:flex-1 before:bg-current before:opacity-60 after:min-h-1.5 after:w-px after:flex-1 after:bg-current after:opacity-60`}
                style={{
                  left: `calc(50% + var(--cmw) * var(--u) * 0.5 + 10px)`,
                  height: cm(altoCm),
                  bottom: abajo,
                  transition: `left ${curva}, height ${curva}`,
                }}
              >
                <span className="rotate-180 [writing-mode:vertical-rl]">{altoCm} cm</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div aria-live="polite">
                <p className="text-[0.8125rem] text-texto-suave">{diseno.categoria}</p>
                <p className="font-display mt-1 text-[2rem]">{diseno.nombre}</p>
              </div>
              <div>
                <p className="font-display text-[2.5rem] tabular-nums">{formatearPesos(precio)}</p>
                <p className="mt-1 text-[0.8125rem] leading-snug text-texto-suave">
                  {medidaCuadro} cm, enmarcado. {frontal?.descripcion}
                </p>
              </div>
              <GrupoOpciones
                nombre="vitrina-medida"
                leyenda="Medida (cm)"
                variante="seg"
                columnas={disponibles.length > 2 ? 'grid-cols-2' : 'grid-cols-2'}
                valor={medida.id}
                onCambio={(v) => {
                  setMedidaId(v);
                  setAgregado(null);
                }}
                opciones={disponibles.map((m) => ({
                  valor: m.id,
                  etiqueta: (
                    <>
                      {etiquetaMedida(m, orientacion)}
                      {m.frontal === 'acrilico' && (
                        <span className="ml-1.5 text-[0.6875rem]">acrílico</span>
                      )}
                    </>
                  ),
                }))}
              />
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
              <p className="border-t border-linea pt-4 text-[0.8125rem] leading-relaxed text-texto-suave">
                Los colores y detalles de cada modelo se pueden cambiar a tu gusto.{' '}
                <a href="/crear" className="font-semibold text-texto underline underline-offset-4">
                  Quiero uno de mi carro o mi moto
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
