import { useStore } from '@nanostores/react';
import type { Medida } from '../../config/negocio';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { $medidas } from '../../stores/precios';

const FRONTAL = { vidrio: 'Vidrio', acrilico: 'Acrílico' } as const;

function Tabla({ titulo, nota, medidas }: { titulo: string; nota: string; medidas: Medida[] }) {
  return (
    <div>
      <h2 className="font-display text-[2rem]">{titulo}</h2>
      <p className="mt-1 mb-4 text-sm text-texto-suave">{nota}</p>
      <table className="w-full border-t-2 border-texto text-left">
        <caption className="sr-only">{titulo}: medidas y precios</caption>
        <thead className="text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2.5 pr-3 font-medium">
              Medida (cm)
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Frente
            </th>
            <th scope="col" className="py-2.5 pl-3 text-right font-medium">
              Precio
            </th>
          </tr>
        </thead>
        <tbody>
          {medidas.map((m) => (
            <tr key={m.id} className="border-t border-linea">
              <th scope="row" className="py-3 pr-3 font-display text-xl font-normal">
                {etiquetaMedida(m, m.panoramica ? 'horizontal' : 'vertical')}
                {m.panoramica && (
                  <span className="ml-2 font-sans text-[0.8125rem] font-normal text-texto-suave">
                    panorámico
                  </span>
                )}
              </th>
              <td className="px-3 py-3 text-texto-suave">{FRONTAL[m.frontal]}</td>
              <td className="py-3 pl-3 text-right font-semibold whitespace-nowrap tabular-nums">
                {formatearPesos(m.precio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Precios activos (negocio.ts + lo editado en el panel), en sus dos líneas. */
export default function TablaPrecios() {
  const medidas = useStore($medidas);
  return (
    <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
      <Tabla
        titulo="Del catálogo"
        nota="Cualquier diseño del catálogo, con los colores y detalles a tu gusto."
        medidas={medidas.filter((m) => m.linea === 'catalogo')}
      />
      <Tabla
        titulo="Personalizados"
        nota="Tu carro o tu moto, ilustrado desde cero con tus fotos."
        medidas={medidas.filter((m) => m.linea === 'personalizado')}
      />
    </div>
  );
}
