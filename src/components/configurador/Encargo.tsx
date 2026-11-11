import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { negocio } from '../../config/negocio';
import { validarArchivo } from '../../lib/archivo';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { calcularAbono } from '../../lib/pedidos';
import { dimensionesMedida } from '../../lib/resolucion';
import { agregarAlCarrito } from '../../stores/carrito';
import { $medidas } from '../../stores/precios';
import GrupoOpciones from '../ui/GrupoOpciones';

// Póster personalizado: el cliente describe su carro o su moto, elige un estilo y una medida, y
// ve un boceto en vivo. El taller no imprime la foto: la usa de referencia para ilustrar. Por eso
// aquí no hay recorte ni aviso de resolución, y las fotos no salen del navegador (se adjuntan en
// el chat de WhatsApp).

// SUPUESTO: seis fotos de referencia bastan (frente, lado, atrás y detalles).
const MAX_FOTOS = 6;

// SUPUESTO: los nombres de los estilos los puso la demo mirando su catálogo; el taller no los
// llama así.
type Estilo = 'ficha' | 'letras' | 'panoramico';
const ESTILOS: { valor: Estilo; etiqueta: string; detalle: string }[] = [
  { valor: 'letras', etiqueta: 'Nombre gigante', detalle: 'La marca en letras enormes' },
  { valor: 'ficha', etiqueta: 'Ficha técnica', detalle: 'De perfil, con sus datos abajo' },
  { valor: 'panoramico', etiqueta: 'Panorámico', detalle: 'Alargado, de perfil a lo ancho' },
];

interface Foto {
  nombre: string;
  url: string;
}

const campo =
  'mt-1.5 block min-h-12 w-full rounded-[4px] border border-linea-fuerte bg-fondo px-3 text-base placeholder:text-texto-suave/70 focus:border-texto';

/** El boceto: un póster armado con CSS con lo que el cliente va escribiendo. */
function Boceto({
  estilo,
  vehiculo,
  anio,
  foto,
  proporcion,
}: {
  estilo: Estilo;
  vehiculo: string;
  anio: string;
  foto?: Foto;
  proporcion: number;
}) {
  const palabras = vehiculo.trim().split(/\s+/).filter(Boolean);
  const marca = palabras[0] ?? 'Tu carro';
  const modelo = palabras.slice(1).join(' ') || (palabras.length ? '' : 'Marca y modelo');
  const hueco = foto ? (
    <img src={foto.url} alt="" className="size-full object-contain" />
  ) : (
    <span className="grid size-full place-items-center rounded-[3px] border border-dashed border-[#0e0e1055] px-2 text-center text-[clamp(9px,2.6cqw,13px)] leading-tight text-[#55565a]">
      Aquí va tu vehículo ilustrado
    </span>
  );
  return (
    <div
      className="marco sombra-cuadro mx-auto w-full [container-type:inline-size]"
      style={{ aspectRatio: String(proporcion), maxWidth: proporcion > 1 ? 560 : 340 }}
      role="img"
      aria-label={`Boceto del póster de ${vehiculo || 'tu vehículo'}`}
    >
      <div className="relative flex size-full flex-col overflow-hidden bg-[#f7f7f5] text-[#0e0e10]">
        {estilo === 'letras' && (
          <span
            aria-hidden="true"
            className="font-display absolute inset-x-0 top-[5%] bg-[linear-gradient(#0e0e10_10%,transparent_95%)] bg-clip-text text-center leading-[0.8] text-transparent"
            style={{ fontSize: `${Math.min(46, 170 / Math.max(marca.length, 3))}cqw` }}
          >
            {marca}
          </span>
        )}
        {estilo !== 'letras' && (
          <p className="px-[6%] pt-[5%] text-[clamp(8px,2.8cqw,14px)] font-semibold tracking-[0.2em] uppercase">
            {marca}
          </p>
        )}
        <div
          className={`relative z-[1] mx-[6%] ${
            estilo === 'panoramico'
              ? 'my-[2%] flex-1'
              : estilo === 'letras'
                ? 'mt-[38%] h-[30%]'
                : 'mt-[22%] h-[34%]'
          }`}
        >
          {hueco}
        </div>
        {estilo !== 'panoramico' && (
          <div className="mt-auto px-[6%] pb-[6%]">
            <p className="font-display text-[clamp(14px,7cqw,34px)]">{modelo || marca}</p>
            <div className="mt-[3%] grid grid-cols-4 gap-[3%] border-t border-[#0e0e10] pt-[3%]">
              {['Motor', 'Potencia', '0-100', anio || 'Año'].map((d) => (
                <span key={d} className="text-[clamp(6px,2.1cqw,10px)] text-[#55565a]">
                  {d}
                  <span className="mt-[18%] block h-[2px] w-3/4 bg-[#0e0e1040]" />
                </span>
              ))}
            </div>
          </div>
        )}
        {estilo === 'panoramico' && (
          <p className="pb-[1.5%] text-center text-[clamp(7px,1.6cqw,11px)] font-semibold tracking-[0.12em] uppercase">
            {[vehiculo.trim() || 'Marca y modelo', anio].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Encargo() {
  const medidas = useStore($medidas);
  const [tipo, setTipo] = useState<'carro' | 'moto'>('carro');
  const [vehiculo, setVehiculo] = useState('');
  const [anio, setAnio] = useState('');
  const [color, setColor] = useState('');
  const [detalles, setDetalles] = useState('');
  const [estilo, setEstilo] = useState<Estilo>('letras');
  const [medidaId, setMedidaId] = useState('p-35x50-acrilico');
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [falta, setFalta] = useState(false);
  const [agregado, setAgregado] = useState<string | null>(null);

  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  // Al salir de la página se liberan las vistas previas.
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const panoramico = estilo === 'panoramico';
  const disponibles = medidas.filter(
    (m) => m.linea === 'personalizado' && Boolean(m.panoramica) === panoramico,
  );
  const medida = disponibles.find((m) => m.id === medidaId) ?? disponibles[0]!;
  const orientacion = panoramico ? 'horizontal' : 'vertical';
  const { anchoCm, altoCm } = dimensionesMedida(medida, orientacion);
  const frontal = negocio.materiales.find((m) => m.id === medida.frontal);
  const abono = calcularAbono(medida.precio, negocio.pagos.porcentajeAbono);

  function alElegirFotos(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    const nuevosErrores: string[] = [];
    const cupo = MAX_FOTOS - fotos.length;
    if (archivos.length > cupo) {
      nuevosErrores.push(`Con ${MAX_FOTOS} fotos de referencia es suficiente.`);
    }
    const nuevas: Foto[] = [];
    for (const archivo of archivos.slice(0, Math.max(0, cupo))) {
      const v = validarArchivo(archivo, negocio.archivo);
      if (v.ok) nuevas.push({ nombre: archivo.name, url: URL.createObjectURL(archivo) });
      else nuevosErrores.push(`${archivo.name}: ${v.mensaje}`);
    }
    setFotos((lista) => [...lista, ...nuevas]);
    setErrores(nuevosErrores);
    setAgregado(null);
  }

  function quitarFoto(url: string) {
    URL.revokeObjectURL(url);
    setFotos((lista) => lista.filter((f) => f.url !== url));
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    const nombre = vehiculo.trim();
    if (!nombre) {
      setFalta(true);
      document.getElementById('encargo-vehiculo')?.focus();
      return;
    }
    const completo = [nombre, anio.trim()].filter(Boolean).join(' ');
    agregarAlCarrito({
      medidaId: medida.id,
      orientacion,
      material: medida.frontal,
      cantidad: 1,
      // Un personalizado no tiene foto que recortar ni calidad que medir: el taller lo ilustra.
      recorte: { x: 0, y: 0, width: 100, height: 100 },
      archivo: completo,
      dimensiones: {
        ancho: Math.round((anchoCm / 2.54) * 300),
        alto: Math.round((altoCm / 2.54) * 300),
      },
      dpi: 300,
      calidad: 'buena',
      encargo: {
        vehiculo: `${tipo === 'moto' ? 'Moto' : 'Carro'}: ${completo}`,
        detalles: [
          `Estilo ${ESTILOS.find((e) => e.valor === estilo)?.etiqueta.toLowerCase()}`,
          color.trim() && `color ${color.trim()}`,
          detalles.trim(),
        ]
          .filter(Boolean)
          .join('. '),
        fotos: fotos.length,
      },
    });
    setAgregado(`${completo} en ${etiquetaMedida(medida, orientacion)} cm`);
  }

  return (
    <form
      onSubmit={alEnviar}
      noValidate
      className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
    >
      <div className="flex flex-col gap-7">
        <GrupoOpciones
          nombre="encargo-tipo"
          leyenda="¿Qué vamos a ilustrar?"
          columnas="grid-cols-2"
          valor={tipo}
          onCambio={setTipo}
          opciones={[
            { valor: 'carro', etiqueta: 'Un carro' },
            { valor: 'moto', etiqueta: 'Una moto' },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <label className="block text-sm font-medium text-texto-suave">
            Marca y modelo
            <input
              id="encargo-vehiculo"
              type="text"
              value={vehiculo}
              onChange={(e) => {
                setVehiculo(e.target.value);
                setFalta(false);
                setAgregado(null);
              }}
              placeholder={tipo === 'moto' ? 'Yamaha MT-09' : 'Mazda 3 Grand Touring'}
              maxLength={60}
              aria-invalid={falta}
              aria-describedby={falta ? 'encargo-falta' : undefined}
              className={`${campo} text-texto ${falta ? 'border-red-700' : ''}`}
            />
            {falta && (
              <span id="encargo-falta" className="mt-1.5 block text-sm text-red-700">
                Escribe la marca y el modelo para saber qué ilustrar.
              </span>
            )}
          </label>
          <label className="block text-sm font-medium text-texto-suave">
            Año
            <input
              type="text"
              inputMode="numeric"
              value={anio}
              onChange={(e) => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="2019"
              className={`${campo} text-texto`}
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-texto-suave">
          Color
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Rojo, con el techo negro"
            maxLength={60}
            className={`${campo} text-texto`}
          />
        </label>

        <label className="block text-sm font-medium text-texto-suave">
          Detalles que no pueden faltar
          <textarea
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
            placeholder="Rines, placa, calcomanías, el fondo que te gustaría…"
            rows={3}
            maxLength={300}
            className={`${campo} py-3 text-texto`}
          />
        </label>

        <div>
          <p className="text-sm font-medium text-texto-suave">Fotos de referencia</p>
          <p className="mt-1 text-sm text-texto-suave">
            Sirven las del celular. No se suben a ningún servidor: las adjuntas tú en el chat de
            WhatsApp al confirmar el pedido.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fotos elegidas">
            {fotos.map((f) => (
              <li key={f.url} className="relative">
                <img src={f.url} alt={f.nombre} className="size-20 rounded-[4px] object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFoto(f.url)}
                  aria-label={`Quitar ${f.nombre}`}
                  className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-texto text-sm leading-none text-fondo"
                >
                  ×
                </button>
              </li>
            ))}
            {fotos.length < MAX_FOTOS && (
              <li>
                <label className="presionable grid size-20 cursor-pointer place-items-center rounded-[4px] border border-dashed border-linea-fuerte text-center text-xs font-medium text-texto-suave hover:border-texto hover:text-texto">
                  <input
                    type="file"
                    multiple
                    accept={negocio.archivo.tipos.join(',')}
                    onChange={alElegirFotos}
                    className="sr-only"
                    data-testid="fotos-referencia"
                  />
                  {fotos.length ? 'Otra foto' : 'Elegir fotos'}
                </label>
              </li>
            )}
          </ul>
          <div aria-live="polite" className="mt-2 text-sm text-red-700 empty:hidden">
            {errores.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <Boceto
          estilo={estilo}
          vehiculo={vehiculo}
          anio={anio}
          foto={fotos[0]}
          proporcion={anchoCm / altoCm}
        />
        <p className="-mt-2 text-center text-[0.8125rem] text-texto-suave">
          Boceto de referencia. El diseño final lo ilustra el taller a mano.
        </p>

        <GrupoOpciones
          nombre="encargo-estilo"
          leyenda="Estilo"
          columnas="grid-cols-1 sm:grid-cols-3"
          valor={estilo}
          onCambio={(v) => {
            setEstilo(v);
            setAgregado(null);
          }}
          opciones={ESTILOS}
        />
        <GrupoOpciones
          nombre="encargo-medida"
          leyenda="Medida (cm)"
          variante="seg"
          columnas="grid-cols-2"
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

        <div className="flex items-end justify-between gap-4 border-t-2 border-texto pt-4">
          <div>
            <p className="font-display text-[2.5rem] tabular-nums" data-testid="precio-encargo">
              {formatearPesos(medida.precio)}
            </p>
            <p className="text-[0.8125rem] text-texto-suave">
              Enmarcado. {frontal?.descripcion} Empiezas con {formatearPesos(abono)}.
            </p>
          </div>
        </div>
        <button type="submit" className="boton boton-oro w-full">
          Agregar al pedido
        </button>
        <div aria-live="polite" className="-mt-3 text-sm empty:hidden">
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
      </div>
    </form>
  );
}
