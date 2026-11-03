import { useStore } from '@nanostores/react';
import { etiquetaMedida, formatearPesos } from '../../lib/formato';
import { describirPromocion } from '../../lib/precios';
import { $medidas } from '../../stores/precios';

/** Tabla de medidas y precios activos (negocio.ts + lo editado en el panel). */
export default function TablaPrecios() {
  const medidas = useStore($medidas);
  return (
    <div className="overflow-x-auto rounded-lg border border-linea">
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="sr-only">Medidas, precios y promociones</caption>
        <thead className="bg-superficie text-texto-suave">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Medida (cm)
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Precio c/u
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Promoción
            </th>
          </tr>
        </thead>
        <tbody>
          {medidas.map((m) => (
            <tr key={m.id} className="border-t border-linea">
              <th scope="row" className="px-4 py-3 font-display text-lg">
                {etiquetaMedida(m)}
              </th>
              <td className="px-4 py-3 whitespace-nowrap">{formatearPesos(m.precio)}</td>
              <td className="px-4 py-3">{describirPromocion(m.promocion) || 'Sin promoción'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
