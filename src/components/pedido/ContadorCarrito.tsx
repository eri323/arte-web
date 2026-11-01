import { useStore } from '@nanostores/react';
import { $cantidadCarrito } from '../../stores/carrito';

/** Link "Pedido" del header con la cantidad de cuadros en el carrito. */
export default function ContadorCarrito({ className }: { className?: string }) {
  const cantidad = useStore($cantidadCarrito);
  return (
    <a href="/pedido" className={className}>
      Pedido
      {cantidad > 0 && (
        <span
          data-testid="contador-carrito"
          className="ml-1 rounded-full bg-dorado px-1.5 text-xs font-semibold text-fondo"
        >
          {cantidad}
        </span>
      )}
      {cantidad > 0 && <span className="sr-only"> {cantidad === 1 ? 'cuadro' : 'cuadros'}</span>}
    </a>
  );
}
