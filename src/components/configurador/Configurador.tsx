import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { negocio, type MaterialId, type Orientacion } from '../../config/negocio';
import { esHeic, MENSAJE_HEIC, validarArchivo } from '../../lib/archivo';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { calcularLineaMedida, sugerenciaPromocion } from '../../lib/precios';
import {
  dimensionesMedida,
  evaluarRecorte,
  medidaMasGrandeBuena,
  pixelesRecorte,
  type AreaPorcentaje,
  type Dimensiones,
} from '../../lib/resolucion';
import { $carrito, agregarAlCarrito } from '../../stores/carrito';
import { guardarMiniatura } from '../../stores/miniaturas';
import { $medidas } from '../../stores/precios';
import EscenaPared from '../escena/EscenaPared';
import GrupoOpciones from '../ui/GrupoOpciones';
import { abrirFoto, crearMiniatura } from './imagen';

interface Foto {
  archivo: string;
  original: Dimensiones;
  vistaPrevia: string;
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

export default function Configurador() {
  const medidas = useStore($medidas);
  const carrito = useStore($carrito);

  const [foto, setFoto] = useState<Foto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [medidaId, setMedidaId] = useState('30x40');
  const [orientacion, setOrientacion] = useState<Orientacion>('vertical');
  const [material, setMaterial] = useState<MaterialId>('mdf');
  const [cantidad, setCantidad] = useState(1);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [recorte, setRecorte] = useState<AreaPorcentaje | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);

  const medida = medidas.find((m) => m.id === medidaId) ?? medidas[0];
  const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
  // El recorte usa la proporción real de la medida (20×27 no es exactamente 3:4).
  const proporcion = anchoCm / altoCm;

  // Libera la vista previa anterior al cambiar de foto o al salir.
  useEffect(() => {
    const url = foto?.vistaPrevia;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [foto?.vistaPrevia]);

  // Si cambia la proporción, el recorte vuelve a centrarse.
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [proporcion]);

  async function alElegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setError(null);
    setAgregado(null);

    const validacion = validarArchivo(archivo, negocio.archivo);
    if (!validacion.ok && validacion.motivo !== 'heic') {
      setError(validacion.mensaje);
      return;
    }

    setCargando(true);
    try {
      const abierta = await abrirFoto(archivo);
      setFoto({ archivo: archivo.name, ...abierta });
      setRecorte(null);
      setOrientacion(abierta.original.ancho > abierta.original.alto ? 'horizontal' : 'vertical');
    } catch {
      // Si el navegador no decodifica HEIC, se explica cómo cambiar el formato.
      setError(
        esHeic(archivo)
          ? MENSAJE_HEIC
          : 'No pudimos abrir esa foto. Prueba con otra o envíala por WhatsApp.',
      );
    } finally {
      setCargando(false);
    }
  }

  const alRecortar = useCallback((area: Area) => setRecorte(area), []);

  const calidad = useMemo(() => {
    if (!foto || !recorte) return null;
    return evaluarRecorte(
      pixelesRecorte(recorte, foto.original),
      medida,
      orientacion,
      negocio.resolucion,
    );
  }, [foto, recorte, medida, orientacion]);

  const sugerida = useMemo(
    () =>
      foto ? medidaMasGrandeBuena(foto.original, medidas, orientacion, negocio.resolucion) : null,
    [foto, medidas, orientacion],
  );

  const linea = calcularLineaMedida(medida, cantidad);
  const enCarrito = carrito
    .filter((i) => i.medidaId === medida.id)
    .reduce((s, i) => s + i.cantidad, 0);
  const promo = sugerenciaPromocion(medida, enCarrito + cantidad);

  async function agregar() {
    if (!foto || !recorte || !calidad) return;
    const id = agregarAlCarrito({
      medidaId: medida.id,
      orientacion,
      material,
      cantidad,
      recorte,
      archivo: foto.archivo,
      dimensiones: foto.original,
      dpi: Math.round(calidad.dpi),
      calidad: calidad.nivel,
    });
    try {
      guardarMiniatura(id, await crearMiniatura(foto.vistaPrevia, recorte));
    } catch {
      // Sin miniatura: el pedido muestra un aviso.
    }
    setAgregado(
      `Agregaste ${cantidad} ${cantidad === 1 ? 'cuadro' : 'cuadros'} de ${etiquetaMedida(medida, orientacion)} al pedido.`,
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-acento/60 px-4 py-4 text-center focus-within:ring-2 focus-within:ring-acento hover:border-acento">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={alElegirArchivo}
            className="sr-only"
          />
          <span>
            <span className="font-medium text-acento-fuerte">
              {foto ? 'Cambiar foto' : 'Sube tu foto'}
            </span>
            <span className="block text-sm text-texto-suave">
              JPG, PNG o WebP de hasta {negocio.archivo.tamanoMaxMB} MB. No sale de tu equipo.
            </span>
          </span>
        </label>

        {cargando && <p className="text-texto-suave">Abriendo tu foto…</p>}
        {error && (
          <p role="alert" className="rounded-lg border border-red-700/50 bg-red-600/10 p-3">
            {error}
          </p>
        )}

        {foto && (
          <>
            <div
              role="group"
              aria-label="Recorte de la foto: arrástrala para moverla y pellizca o usa el zoom para acercarla"
              className="relative h-80 overflow-hidden rounded-lg bg-black sm:h-96"
            >
              <Cropper
                image={foto.vistaPrevia}
                crop={crop}
                zoom={zoom}
                aspect={proporcion}
                onCropChange={setCrop}
                onZoomChange={setZoom}
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
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-11 flex-1 accent-acento"
              />
            </label>
            <p className="text-sm text-texto-suave">
              {foto.archivo} · {foto.original.ancho}×{foto.original.alto} px
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <GrupoOpciones
          nombre="medida"
          leyenda="Medida (cm)"
          valor={medida.id}
          onCambio={(v) => setMedidaId(v)}
          opciones={medidas.map((m) => ({
            valor: m.id,
            etiqueta: etiquetaMedida(m, orientacion),
            detalle: formatearPesos(m.precio),
          }))}
        />
        <GrupoOpciones
          nombre="orientacion"
          leyenda="Orientación"
          valor={orientacion}
          onCambio={setOrientacion}
          columnas="grid-cols-2"
          opciones={negocio.orientaciones.map((o) => ({
            valor: o,
            etiqueta: o === 'vertical' ? 'Vertical' : 'Horizontal',
          }))}
        />
        <GrupoOpciones
          nombre="material"
          leyenda="Material"
          valor={material}
          onCambio={setMaterial}
          columnas="grid-cols-2"
          opciones={negocio.materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
        />

        <div>
          <span id="cantidad-etiqueta" className="mb-2 block text-sm font-medium text-texto-suave">
            Cantidad
          </span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="cantidad-etiqueta">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              aria-label="Quitar uno"
              className="size-11 rounded-lg border border-linea-fuerte text-xl"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={cantidad}
              aria-label="Cantidad"
              onChange={(e) =>
                setCantidad(Math.min(99, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))
              }
              className="h-11 w-16 rounded-lg border border-linea-fuerte bg-transparent text-center"
            />
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.min(99, c + 1))}
              aria-label="Agregar uno"
              className="size-11 rounded-lg border border-linea-fuerte text-xl"
            >
              +
            </button>
          </div>
        </div>

        <div aria-live="polite" className="flex flex-col gap-2">
          {calidad && (
            <p className={`rounded-lg border p-3 ${ESTILO_CALIDAD[calidad.nivel]}`}>
              <strong>{TEXTO_CALIDAD[calidad.nivel]}</strong> para{' '}
              {etiquetaMedida(medida, orientacion)} ({Math.round(calidad.dpi)} dpi).
            </p>
          )}
          {foto && (
            <p className="text-sm text-texto-suave">
              {sugerida ? (
                <>
                  La medida más grande con calidad buena para esta foto es{' '}
                  <strong className="text-texto">{etiquetaMedida(sugerida, orientacion)}</strong>.{' '}
                  {sugerida.id !== medida.id && (
                    <button
                      type="button"
                      onClick={() => setMedidaId(sugerida.id)}
                      className="min-h-11 text-acento-fuerte underline underline-offset-4"
                    >
                      Usar {etiquetaMedida(sugerida, orientacion)}
                    </button>
                  )}
                </>
              ) : (
                'Esta foto no alcanza calidad buena en ninguna medida.'
              )}
            </p>
          )}
        </div>

        <EscenaPared
          titulo={`Vista previa de un cuadro de ${etiquetaMedida(medida, orientacion)} en ${material === 'mdf' ? 'MDF' : 'acrílico'} sobre un sofá de 200 cm`}
          cuadro={{
            anchoCm,
            altoCm,
            material,
            imagen: foto?.vistaPrevia,
            recorte: recorte ?? undefined,
          }}
        />

        <div className="rounded-lg border border-linea bg-superficie p-4">
          <p className="flex items-baseline justify-between gap-4">
            <span className="text-texto-suave">
              {cantidad} × {etiquetaMedida(medida, orientacion)}
            </span>
            <span className="font-display text-3xl" data-testid="precio">
              {formatearPesos(linea.total)}
            </span>
          </p>
          {linea.descuento > 0 && (
            <p className="text-right text-sm text-texto-suave">
              <s>{formatearPesos(linea.subtotal)}</s> · ahorras {formatearPesos(linea.descuento)}
            </p>
          )}
          {promo && <p className="mt-2 text-sm text-acento-fuerte">{promo.mensaje}</p>}
          <button
            type="button"
            onClick={agregar}
            disabled={!foto || !recorte}
            className="mt-4 boton boton-oro w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar al pedido
          </button>
          {!foto && (
            <p className="mt-2 text-center text-sm text-texto-suave">
              Sube una foto para continuar.
            </p>
          )}
        </div>

        {agregado && (
          <p role="status" className="rounded-lg border border-acento/50 bg-acento/10 p-3">
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
    </div>
  );
}
