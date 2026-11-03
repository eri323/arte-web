import { useStore } from '@nanostores/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { negocio, type MaterialId, type Orientacion } from '../../config/negocio';
import { esHeic, MENSAJE_HEIC, validarArchivo } from '../../lib/archivo';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { calcularDesglose, sugerenciaPromocion } from '../../lib/precios';
import {
  dimensionesMedida,
  evaluarRecorte,
  medidaMasGrandeBuena,
  pixelesRecorte,
  recorteCompleto,
  type AreaPorcentaje,
  type Dimensiones,
} from '../../lib/resolucion';
import { $carrito, agregarAlCarrito } from '../../stores/carrito';
import { guardarMiniatura } from '../../stores/miniaturas';
import { $medidas } from '../../stores/precios';
import EscenaPared from '../escena/EscenaPared';
import GrupoOpciones from '../ui/GrupoOpciones';
import { abrirFoto, crearMiniatura } from './imagen';

// Configurador por tandas: el cliente sube varias fotos de una vez, ajusta cada una (medida,
// recorte, material, cantidad) y las agrega todas al pedido con un solo botón. Así es fácil
// llegar a las promociones (5 de 20×27, 3 de 30×40…). Las fotos no salen del navegador.

// SUPUESTO: 20 fotos por tanda. Cada vista previa ocupa memoria y en un celular de gama media más
// fotos a la vez lo pueden poner lento. Después de agregarlas se puede subir otra tanda.
const MAX_FOTOS = 20;

interface FotoTrabajo {
  id: string;
  archivo: string;
  original: Dimensiones;
  vistaPrevia: string;
  medidaId: string;
  orientacion: Orientacion;
  material: MaterialId;
  cantidad: number;
  crop: Point;
  zoom: number;
  /** Recorte en porcentajes. Arranca centrado y lo afina el cliente al mover la foto. */
  recorte: AreaPorcentaje;
}

const TEXTO_CALIDAD = {
  buena: 'Calidad buena',
  regular:
    'Calidad regular: se puede imprimir, pero de cerca se notará algo de pérdida de nitidez.',
  baja: 'Calidad baja: tu foto no tiene suficiente resolución para esta medida.',
} as const;

const ESTILO_CALIDAD = {
  buena: 'border-emerald-700/40 bg-emerald-600/10',
  regular: 'border-amber-600/50 bg-amber-400/15',
  baja: 'border-red-700/50 bg-red-600/10',
} as const;

const PUNTO_CALIDAD = {
  buena: 'bg-emerald-500',
  regular: 'bg-amber-400',
  baja: 'bg-red-500',
} as const;

let siguienteId = 0;

export default function Configurador() {
  const medidas = useStore($medidas);
  const carrito = useStore($carrito);

  const [fotos, setFotos] = useState<FotoTrabajo[]>([]);
  const [activaId, setActivaId] = useState<string | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);
  const [encima, setEncima] = useState(false);
  // Medida y material con que llegan las fotos nuevas. Desde la pared de la portada vienen en la URL.
  const [base, setBase] = useState<{ medidaId: string; material: MaterialId }>({
    medidaId: '30x40',
    material: 'mdf',
  });

  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const medidaUrl = params.get('medida');
    const materialUrl = negocio.materiales.find((m) => m.id === params.get('material'))?.id;
    setBase((b) => ({
      medidaId: medidaUrl && medidas.some((m) => m.id === medidaUrl) ? medidaUrl : b.medidaId,
      material: materialUrl ?? b.material,
    }));
    // Al salir de la página se liberan todas las vistas previas.
    return () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.vistaPrevia));
    // Solo al abrir la página.
  }, []);

  const activa = fotos.find((f) => f.id === activaId) ?? fotos[0] ?? null;
  const medidaDe = (f: FotoTrabajo) => medidas.find((m) => m.id === f.medidaId) ?? medidas[0]!;

  function proporcionDe(f: Pick<FotoTrabajo, 'medidaId' | 'orientacion'>) {
    const medida = medidas.find((m) => m.id === f.medidaId) ?? medidas[0]!;
    const { anchoCm, altoCm } = dimensionesMedida(medida, f.orientacion);
    // El recorte usa la proporción real de la medida (20×27 no es exactamente 3:4).
    return anchoCm / altoCm;
  }

  /** Cambia una foto. Si cambia su forma (medida u orientación), el recorte vuelve a centrarse. */
  function actualizar(id: string, cambios: Partial<FotoTrabajo>) {
    setAgregado(null);
    setFotos((lista) =>
      lista.map((f) => {
        if (f.id !== id) return f;
        const nueva = { ...f, ...cambios };
        if (proporcionDe(nueva) !== proporcionDe(f)) {
          nueva.crop = { x: 0, y: 0 };
          nueva.zoom = 1;
          nueva.recorte = recorteCompleto(nueva.original, proporcionDe(nueva));
        }
        return nueva;
      }),
    );
  }

  async function usarArchivos(archivos: File[]) {
    if (archivos.length === 0) return;
    setAgregado(null);
    const nuevosErrores: string[] = [];
    const cupo = MAX_FOTOS - fotos.length;
    if (archivos.length > cupo) {
      nuevosErrores.push(
        `Puedes subir hasta ${MAX_FOTOS} fotos por tanda. Agrega estas al pedido y sube las demás después.`,
      );
    }
    const aAbrir = archivos.slice(0, Math.max(0, cupo));
    setProgreso({ hechas: 0, total: aAbrir.length });

    // Una por una, para no decodificar varias fotos de 48 MP al mismo tiempo.
    for (const [i, archivo] of aAbrir.entries()) {
      const validacion = validarArchivo(archivo, negocio.archivo);
      if (!validacion.ok && validacion.motivo !== 'heic') {
        nuevosErrores.push(
          aAbrir.length > 1 ? `${archivo.name}: ${validacion.mensaje}` : validacion.mensaje,
        );
      } else {
        try {
          const abierta = await abrirFoto(archivo);
          const orientacion: Orientacion =
            abierta.original.ancho > abierta.original.alto ? 'horizontal' : 'vertical';
          const foto: FotoTrabajo = {
            id: `foto-${++siguienteId}`,
            archivo: archivo.name,
            ...abierta,
            medidaId: base.medidaId,
            orientacion,
            material: base.material,
            cantidad: 1,
            crop: { x: 0, y: 0 },
            zoom: 1,
            recorte: recorteCompleto(
              abierta.original,
              proporcionDe({ medidaId: base.medidaId, orientacion }),
            ),
          };
          setFotos((lista) => [...lista, foto]);
          // La primera foto nueva queda abierta para ajustarla.
          if (i === 0) setActivaId(foto.id);
        } catch {
          // Si el navegador no decodifica HEIC, se explica cómo cambiar el formato.
          const mensaje = esHeic(archivo)
            ? MENSAJE_HEIC
            : 'No pudimos abrir esa foto. Prueba con otra o envíala por WhatsApp.';
          nuevosErrores.push(aAbrir.length > 1 ? `${archivo.name}: ${mensaje}` : mensaje);
        }
      }
      setProgreso({ hechas: i + 1, total: aAbrir.length });
    }
    setProgreso(null);
    setErrores(nuevosErrores);
  }

  function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    void usarArchivos(archivos);
  }

  function alSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setEncima(false);
    void usarArchivos(Array.from(evento.dataTransfer.files));
  }

  function quitar(id: string) {
    const foto = fotos.find((f) => f.id === id);
    if (foto) URL.revokeObjectURL(foto.vistaPrevia);
    const resto = fotos.filter((f) => f.id !== id);
    setFotos(resto);
    if (activa?.id === id) setActivaId(resto[0]?.id ?? null);
    setAgregado(null);
  }

  /** Pone la medida y el material de la foto abierta en todas: lo práctico para las promociones. */
  function igualarTodas() {
    if (!activa) return;
    for (const f of fotos) {
      if (f.id !== activa.id)
        actualizar(f.id, { medidaId: activa.medidaId, material: activa.material });
    }
  }

  const idAbierta = activa?.id;
  const alRecortar = useCallback(
    (area: Area) => {
      if (!idAbierta) return;
      setFotos((lista) => lista.map((f) => (f.id === idAbierta ? { ...f, recorte: area } : f)));
    },
    [idAbierta],
  );

  const calidadDe = (f: FotoTrabajo) =>
    evaluarRecorte(
      pixelesRecorte(f.recorte, f.original),
      medidaDe(f),
      f.orientacion,
      negocio.resolucion,
    );

  const medida = activa ? medidaDe(activa) : medidas.find((m) => m.id === base.medidaId)!;
  const calidad = activa ? calidadDe(activa) : null;
  const sugerida = useMemo(
    () =>
      activa
        ? medidaMasGrandeBuena(activa.original, medidas, activa.orientacion, negocio.resolucion)
        : null,
    [activa, medidas],
  );

  // Lo que suma la tanda, con las promociones por medida (igual que en el pedido).
  const desglose = calcularDesglose(
    fotos.map((f) => ({ medidaId: f.medidaId, cantidad: f.cantidad })),
    medidas,
    negocio.pagos.porcentajeAbono,
  );
  const cuadros = fotos.reduce((s, f) => s + f.cantidad, 0);
  const enCarrito = carrito
    .filter((i) => i.medidaId === medida.id)
    .reduce((s, i) => s + i.cantidad, 0);
  const enTanda = fotos.filter((f) => f.medidaId === medida.id).reduce((s, f) => s + f.cantidad, 0);
  const promo = activa ? sugerenciaPromocion(medida, enCarrito + enTanda) : null;

  async function agregarTodas() {
    if (fotos.length === 0) return;
    const resumen = new Map<string, number>();
    for (const f of fotos) {
      const m = medidaDe(f);
      const c = calidadDe(f);
      const id = agregarAlCarrito({
        medidaId: m.id,
        orientacion: f.orientacion,
        material: f.material,
        cantidad: f.cantidad,
        recorte: f.recorte,
        archivo: f.archivo,
        dimensiones: f.original,
        dpi: Math.round(c.dpi),
        calidad: c.nivel,
      });
      const etiqueta = etiquetaMedida(m, f.orientacion);
      resumen.set(etiqueta, (resumen.get(etiqueta) ?? 0) + f.cantidad);
      try {
        guardarMiniatura(id, await crearMiniatura(f.vistaPrevia, f.recorte));
      } catch {
        // Sin miniatura: el pedido muestra un aviso.
      }
    }
    const total = [...resumen.values()].reduce((s, n) => s + n, 0);
    const palabra = total === 1 ? 'cuadro' : 'cuadros';
    const partes = [...resumen].map(([etiqueta, n]) => `${n} de ${etiqueta}`);
    setAgregado(
      resumen.size === 1
        ? `Agregaste ${total} ${palabra} de ${[...resumen.keys()][0]} al pedido.`
        : `Agregaste ${total} ${palabra} al pedido: ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`,
    );
    // La tanda queda vacía para subir la siguiente.
    fotos.forEach((f) => URL.revokeObjectURL(f.vistaPrevia));
    setFotos([]);
    setActivaId(null);
  }

  const zonaSubir = (
    <label
      onDragEnter={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setEncima(false)}
      onDrop={alSoltar}
      className={`flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-dashed px-4 py-4 text-center transition-colors focus-within:ring-2 focus-within:ring-acento hover:border-acento ${
        encima ? 'border-acento bg-acento/10' : 'border-acento/60'
      } ${fotos.length === 0 ? 'min-h-48 sm:min-h-56' : ''}`}
    >
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={alElegir}
        className="sr-only"
      />
      <span>
        <span className="font-medium text-acento-fuerte">
          {fotos.length ? 'Agregar más fotos' : 'Sube tus fotos'}
        </span>
        <span className="block text-sm text-texto-suave">
          {fotos.length
            ? `Llevas ${fotos.length} de ${MAX_FOTOS}.`
            : `Elige una o varias a la vez (hasta ${MAX_FOTOS}). JPG, PNG o WebP de hasta ${negocio.archivo.tamanoMaxMB} MB.`}{' '}
          No salen de tu equipo.
        </span>
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      {zonaSubir}
      {progreso && (
        <p className="text-texto-suave">
          Abriendo{' '}
          {progreso.total > 1 ? `foto ${progreso.hechas + 1} de ${progreso.total}` : 'tu foto'}…
        </p>
      )}
      {errores.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-700/50 bg-red-600/10 p-3">
          {errores.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {fotos.length > 0 && (
        <div>
          <p id="tanda-titulo" className="mb-2 text-sm font-medium text-texto-suave">
            Tus fotos ({fotos.length}) · toca una para ajustarla
          </p>
          <ul aria-labelledby="tanda-titulo" className="flex gap-3 overflow-x-auto pt-1 pb-2">
            {fotos.map((f) => {
              const c = calidadDe(f);
              const etiqueta = etiquetaMedida(medidaDe(f), f.orientacion);
              const abierta = f.id === activa?.id;
              return (
                <li key={f.id} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivaId(f.id)}
                    aria-pressed={abierta}
                    aria-label={`${f.archivo}: ${f.cantidad} de ${etiqueta}, calidad ${c.nivel}`}
                    className={`block w-24 overflow-hidden rounded-lg border-2 text-left transition-colors ${
                      abierta ? 'border-texto' : 'border-transparent hover:border-linea-fuerte'
                    }`}
                  >
                    <img src={f.vistaPrevia} alt="" className="block h-24 w-full object-cover" />
                    <span className="flex items-center gap-1.5 bg-superficie px-2 py-1 text-xs tabular-nums">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full ${PUNTO_CALIDAD[c.nivel]}`}
                      />
                      {f.cantidad > 1 ? `${f.cantidad}× ` : ''}
                      {etiqueta}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(f.id)}
                    aria-label={`Quitar ${f.archivo}`}
                    className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-texto text-sm text-fondo"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activa && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <div
              role="group"
              aria-label="Recorte de la foto: arrástrala para moverla y pellizca o usa el zoom para acercarla"
              className="relative h-80 overflow-hidden rounded-lg bg-black sm:h-96"
            >
              <Cropper
                key={activa.id}
                image={activa.vistaPrevia}
                crop={activa.crop}
                zoom={activa.zoom}
                aspect={proporcionDe(activa)}
                onCropChange={(crop) => actualizar(activa.id, { crop })}
                onZoomChange={(zoom) => actualizar(activa.id, { zoom })}
                onCropComplete={alRecortar}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-texto-suave">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={activa.zoom}
                onChange={(e) => actualizar(activa.id, { zoom: Number(e.target.value) })}
                className="h-11 flex-1 accent-acento"
              />
            </label>
            <p className="text-sm text-texto-suave">
              {activa.archivo} · {activa.original.ancho}×{activa.original.alto} px
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <GrupoOpciones
              nombre="medida"
              leyenda="Medida (cm)"
              valor={medida.id}
              onCambio={(v) => actualizar(activa.id, { medidaId: v })}
              opciones={medidas.map((m) => ({
                valor: m.id,
                etiqueta: etiquetaMedida(m, activa.orientacion),
                detalle: formatearPesos(m.precio),
              }))}
            />
            <GrupoOpciones
              nombre="orientacion"
              leyenda="Orientación"
              valor={activa.orientacion}
              onCambio={(v) => actualizar(activa.id, { orientacion: v })}
              columnas="grid-cols-2"
              opciones={negocio.orientaciones.map((o) => ({
                valor: o,
                etiqueta: o === 'vertical' ? 'Vertical' : 'Horizontal',
              }))}
            />
            <GrupoOpciones
              nombre="material"
              leyenda="Material"
              valor={activa.material}
              onCambio={(v) => actualizar(activa.id, { material: v })}
              columnas="grid-cols-2"
              opciones={negocio.materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
            />

            <div>
              <span
                id="cantidad-etiqueta"
                className="mb-2 block text-sm font-medium text-texto-suave"
              >
                Copias de esta foto
              </span>
              <div
                className="flex items-center gap-2"
                role="group"
                aria-labelledby="cantidad-etiqueta"
              >
                <button
                  type="button"
                  onClick={() =>
                    actualizar(activa.id, { cantidad: Math.max(1, activa.cantidad - 1) })
                  }
                  aria-label="Quitar uno"
                  className="size-11 rounded-lg border border-linea-fuerte text-xl"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={activa.cantidad}
                  aria-label="Cantidad"
                  onChange={(e) =>
                    actualizar(activa.id, {
                      cantidad: Math.min(99, Math.max(1, Math.trunc(Number(e.target.value)) || 1)),
                    })
                  }
                  className="h-11 w-16 rounded-lg border border-linea-fuerte bg-transparent text-center"
                />
                <button
                  type="button"
                  onClick={() =>
                    actualizar(activa.id, { cantidad: Math.min(99, activa.cantidad + 1) })
                  }
                  aria-label="Agregar uno"
                  className="size-11 rounded-lg border border-linea-fuerte text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {fotos.length > 1 && (
              <button type="button" onClick={igualarTodas} className="boton boton-linea self-start">
                Usar {etiquetaMedida(medida, activa.orientacion)} en{' '}
                {activa.material === 'mdf' ? 'MDF' : 'acrílico'} para todas
              </button>
            )}

            <div aria-live="polite" className="flex flex-col gap-2">
              {calidad && (
                <p className={`rounded-lg border p-3 ${ESTILO_CALIDAD[calidad.nivel]}`}>
                  <strong>{TEXTO_CALIDAD[calidad.nivel]}</strong> para{' '}
                  {etiquetaMedida(medida, activa.orientacion)} ({Math.round(calidad.dpi)} dpi).
                </p>
              )}
              <p className="text-sm text-texto-suave">
                {sugerida ? (
                  <>
                    La medida más grande con calidad buena para esta foto es{' '}
                    <strong className="text-texto">
                      {etiquetaMedida(sugerida, activa.orientacion)}
                    </strong>
                    .{' '}
                    {sugerida.id !== medida.id && (
                      <button
                        type="button"
                        onClick={() => actualizar(activa.id, { medidaId: sugerida.id })}
                        className="min-h-11 text-acento-fuerte underline underline-offset-4"
                      >
                        Usar {etiquetaMedida(sugerida, activa.orientacion)}
                      </button>
                    )}
                  </>
                ) : (
                  'Esta foto no alcanza calidad buena en ninguna medida.'
                )}
              </p>
            </div>

            <EscenaPared
              titulo={`Vista previa de un cuadro de ${etiquetaMedida(medida, activa.orientacion)} en ${activa.material === 'mdf' ? 'MDF' : 'acrílico'} sobre un sofá de 200 cm`}
              cuadro={{
                ...dimensionesMedida(medida, activa.orientacion),
                material: activa.material,
                imagen: activa.vistaPrevia,
                recorte: activa.recorte,
              }}
            />
          </div>
        </div>
      )}

      {(fotos.length > 0 || agregado) && (
        <div className="rounded-lg border border-linea bg-superficie p-4">
          {fotos.length > 0 && (
            <>
              <ul className="flex flex-col gap-1 text-sm text-texto-suave">
                {desglose.lineas.map((l) => {
                  const m = medidas.find((x) => x.id === l.medidaId)!;
                  return (
                    <li key={l.medidaId} className="flex justify-between gap-4 tabular-nums">
                      <span>
                        {l.cantidad} × {etiquetaMedida(m)}
                        {l.descuento > 0 && ' · con promoción'}
                      </span>
                      <span>{formatearPesos(l.total)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 flex items-baseline justify-between gap-4">
                <span className="text-texto-suave">
                  {cuadros} {cuadros === 1 ? 'cuadro' : 'cuadros'}
                </span>
                <span className="font-display text-3xl" data-testid="precio">
                  {formatearPesos(desglose.total)}
                </span>
              </p>
              {desglose.descuento > 0 && (
                <p className="text-right text-sm text-texto-suave">
                  <s>{formatearPesos(desglose.subtotal)}</s> · ahorras{' '}
                  {formatearPesos(desglose.descuento)}
                </p>
              )}
              {promo && <p className="mt-2 text-sm text-acento-fuerte">{promo.mensaje}</p>}
              <button
                type="button"
                onClick={agregarTodas}
                disabled={progreso !== null}
                className="mt-4 boton boton-oro w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fotos.length === 1
                  ? 'Agregar al pedido'
                  : `Agregar las ${fotos.length} fotos al pedido`}
              </button>
            </>
          )}
          {agregado && (
            <p role="status" className={fotos.length > 0 ? 'mt-3' : ''}>
              {agregado}{' '}
              <a
                href="/pedido"
                className="font-medium text-acento-fuerte underline underline-offset-4"
              >
                Ver mi pedido
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
