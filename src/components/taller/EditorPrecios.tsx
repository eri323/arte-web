import { useStore } from '@nanostores/react';
import { useState } from 'react';
import type { Medida, Promocion } from '../../config/negocio';
import { etiquetaMedida } from '../../lib/formato';
import { describirPromocion } from '../../lib/precios';
import { $medidas, editarMedida, restaurarPrecios } from '../../stores/precios';

type TipoPromo = 'ninguna' | Promocion['tipo'];
const campo = 'h-11 w-full rounded-lg border border-white/15 bg-transparent px-3';

function FilaPrecio({ medida }: { medida: Medida }) {
  const etiqueta = etiquetaMedida(medida);
  const p = medida.promocion;
  const [precio, setPrecio] = useState(String(medida.precio));
  const [tipo, setTipo] = useState<TipoPromo>(p?.tipo ?? 'ninguna');
  const [cantidad, setCantidad] = useState(
    String(p ? (p.tipo === 'desde' ? p.cantidadMinima : p.cantidad) : ''),
  );
  const [valor, setValor] = useState(
    String(p ? (p.tipo === 'desde' ? p.precioUnitario : p.precioPaquete) : ''),
  );
  const [aviso, setAviso] = useState<string | null>(null);

  function guardar() {
    const nPrecio = Number(precio);
    const nCantidad = Number(cantidad);
    const nValor = Number(valor);
    const entero = (n: number) => Number.isInteger(n) && n > 0;
    if (!entero(nPrecio)) return setAviso('El precio debe ser un número entero de pesos.');
    let promocion: Promocion | null = null;
    if (tipo !== 'ninguna') {
      if (!entero(nCantidad) || !entero(nValor) || (tipo === 'paquete' && nCantidad < 2)) {
        return setAviso('Revisa la cantidad y el valor de la promoción.');
      }
      promocion =
        tipo === 'desde'
          ? { tipo, cantidadMinima: nCantidad, precioUnitario: nValor }
          : { tipo, cantidad: nCantidad, precioPaquete: nValor };
    }
    if (
      promocion &&
      (promocion.tipo === 'desde'
        ? promocion.precioUnitario >= nPrecio
        : promocion.precioPaquete >= promocion.cantidad * nPrecio)
    ) {
      return setAviso('La promoción tiene que salir más barata que comprar los cuadros sueltos.');
    }
    editarMedida(medida.id, { precio: nPrecio, promocion });
    setAviso('Guardado.');
  }

  return (
    <fieldset className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-[6rem_1fr_1fr_1fr_1fr_auto] sm:items-end">
      <legend className="sr-only">Medida {etiqueta}</legend>
      <p className="font-serif text-xl font-semibold text-dorado sm:self-center" aria-hidden="true">
        {etiqueta}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-texto-suave">Precio {etiqueta}</span>
        <input
          type="number"
          min={1}
          step={1}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-texto-suave">Promoción</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoPromo)}
          className={`${campo} bg-fondo`}
        >
          <option value="ninguna">Ninguna</option>
          <option value="desde">N o más a X c/u</option>
          <option value="paquete">N por X</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-texto-suave">Cantidad (N)</span>
        <input
          type="number"
          min={1}
          step={1}
          value={cantidad}
          disabled={tipo === 'ninguna'}
          onChange={(e) => setCantidad(e.target.value)}
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-texto-suave">Valor (X)</span>
        <input
          type="number"
          min={1}
          step={1}
          value={valor}
          disabled={tipo === 'ninguna'}
          onChange={(e) => setValor(e.target.value)}
          className={campo}
        />
      </label>
      <button
        type="button"
        onClick={guardar}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-dorado/60 px-5 font-medium hover:border-dorado"
      >
        Guardar {etiqueta}
      </button>
      <p className="text-sm text-texto-suave sm:col-span-6" aria-live="polite">
        {aviso ?? (describirPromocion(medida.promocion) || 'Sin promoción')}
      </p>
    </fieldset>
  );
}

export default function EditorPrecios() {
  const medidas = useStore($medidas);
  const [version, setVersion] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      {medidas.map((m) => (
        <FilaPrecio key={`${m.id}-${version}`} medida={m} />
      ))}
      <button
        type="button"
        onClick={() => {
          restaurarPrecios();
          setVersion((v) => v + 1);
        }}
        className="self-start text-sm text-texto-suave underline underline-offset-4 hover:text-texto min-h-11"
      >
        Volver a los precios de negocio.ts
      </button>
    </div>
  );
}
