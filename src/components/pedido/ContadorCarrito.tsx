import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import { $cantidadCarrito } from '../../stores/carrito';

/** Link "Pedido" del header con la cantidad de pósters en el carrito. */
export default function ContadorCarrito({ className }: { className?: string }) {
  const cantidad = useStore($cantidadCarrito);
  const insignia = useRef<HTMLSpanElement>(null);
  const anterior = useRef(cantidad);

  // Cuando entra un póster, el número da un saltito: confirma desde el header que se agregó.
  useEffect(() => {
    const subio = cantidad > anterior.current;
    anterior.current = cantidad;
    const el = insignia.current;
    if (!subio || !el || typeof el.animate !== 'function') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  }, [cantidad]);

  return (
    <a href="/pedido" className={className}>
      Pedido
      {cantidad > 0 && (
        <span
          ref={insignia}
          data-testid="contador-carrito"
          className="ml-1 inline-block min-w-5 rounded-sm bg-acento px-1 text-center text-xs font-bold text-sobre-acento"
        >
          {cantidad}
        </span>
      )}
      {cantidad > 0 && <span className="sr-only"> {cantidad === 1 ? 'póster' : 'pósters'}</span>}
    </a>
  );
}
