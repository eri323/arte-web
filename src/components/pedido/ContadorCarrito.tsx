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
          className="ml-1 min-w-5 rounded-sm bg-acento px-1 text-center text-xs font-bold text-fondo"
        >
          {cantidad}
        </span>
      )}
      {cantidad > 0 && <span className="sr-only"> {cantidad === 1 ? 'cuadro' : 'cuadros'}</span>}
    </a>
  );
}
