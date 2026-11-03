import { useId } from 'react';
import type { MaterialId } from '../../config/negocio';
import { ESCENA, rectCuadro, rectSofa } from '../../lib/escena';
import type { AreaPorcentaje } from '../../lib/resolucion';

// Pared y sofá en SVG con viewBox en centímetros: la escala es exacta y no hace falta licenciar
// fotos. Se usa sin JS en /formatos y como parte de la isla del configurador.

export interface CuadroEscena {
  anchoCm: number;
  altoCm: number;
  material: MaterialId;
  /** URL de la vista previa; si falta, se pinta un degradado. */
  imagen?: string;
  /** Recorte en porcentajes de la imagen original. */
  recorte?: AreaPorcentaje;
}

export interface ContornoEscena {
  anchoCm: number;
  altoCm: number;
  etiqueta: string;
}

interface Props {
  cuadro?: CuadroEscena;
  contornos?: ContornoEscena[];
  titulo: string;
}

function Sofa() {
  const s = rectSofa();
  const respaldoAlto = s.alto - ESCENA.sofa.asientoCm + 10;
  return (
    <g aria-hidden="true">
      <rect x={s.x + 10} y={s.y} width={s.ancho - 20} height={respaldoAlto} rx={6} fill="#2c2724" />
      <rect
        x={s.x + 14}
        y={s.y + respaldoAlto - 12}
        width={s.ancho - 28}
        height={22}
        rx={4}
        fill="#3b3632"
      />
      <rect x={s.x} y={s.y + 20} width={20} height={s.alto - 30} rx={6} fill="#272220" />
      <rect
        x={s.x + s.ancho - 20}
        y={s.y + 20}
        width={20}
        height={s.alto - 30}
        rx={6}
        fill="#272220"
      />
      <rect x={s.x + 6} y={s.y + s.alto - 10} width={4} height={10} fill="#0f0d0c" />
      <rect x={s.x + s.ancho - 10} y={s.y + s.alto - 10} width={4} height={10} fill="#0f0d0c" />
    </g>
  );
}

export default function EscenaPared({ cuadro, contornos = [], titulo }: Props) {
  const id = useId().replace(/:/g, '');
  const r = cuadro ? rectCuadro(cuadro.anchoCm, cuadro.altoCm) : null;
  const acrilico = cuadro?.material === 'acrilico';
  const recorte = cuadro?.recorte ?? { x: 0, y: 0, width: 100, height: 100 };

  return (
    <svg
      viewBox={`0 0 ${ESCENA.anchoCm} ${ESCENA.altoCm}`}
      role="img"
      aria-label={titulo}
      className="block h-auto w-full rounded-lg"
    >
      <defs>
        <linearGradient id={`${id}-pared`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1714" />
          <stop offset="1" stopColor="#0e0c0a" />
        </linearGradient>
        <linearGradient id={`${id}-relleno`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d88b" />
          <stop offset="1" stopColor="#ff2d20" />
        </linearGradient>
        <linearGradient id={`${id}-brillo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-sombra`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy={acrilico ? 2 : 1}
            stdDeviation={acrilico ? 2.5 : 1.5}
            floodColor="#000"
            floodOpacity={acrilico ? 0.7 : 0.55}
          />
        </filter>
      </defs>

      <rect width={ESCENA.anchoCm} height={ESCENA.altoCm} fill={`url(#${id}-pared)`} />
      <rect y={ESCENA.altoCm - 4} width={ESCENA.anchoCm} height={4} fill="#221d19" />
      <Sofa />

      {contornos.map((c) => {
        const rc = rectCuadro(c.anchoCm, c.altoCm);
        return (
          <g key={c.etiqueta}>
            <rect
              x={rc.x}
              y={rc.y}
              width={rc.ancho}
              height={rc.alto}
              fill="none"
              stroke="#e7b94c"
              strokeWidth={0.8}
              strokeDasharray="3 2"
            />
            <text
              x={rc.x + 1.5}
              y={rc.y + 5}
              fontSize={5}
              fill="#f6d88b"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}
            >
              {c.etiqueta}
            </text>
          </g>
        );
      })}

      {cuadro && r && (
        <g filter={`url(#${id}-sombra)`}>
          {/* MDF: canto oscuro de unos 3 mm. */}
          {!acrilico && (
            <rect
              x={r.x - 0.3}
              y={r.y - 0.3}
              width={r.ancho + 0.6}
              height={r.alto + 0.6}
              fill="#000000"
            />
          )}
          <svg
            x={r.x}
            y={r.y}
            width={r.ancho}
            height={r.alto}
            viewBox={`${recorte.x} ${recorte.y} ${recorte.width} ${recorte.height}`}
            preserveAspectRatio="none"
          >
            {cuadro.imagen ? (
              <image
                href={cuadro.imagen}
                x={0}
                y={0}
                width={100}
                height={100}
                preserveAspectRatio="none"
              />
            ) : (
              <rect width={100} height={100} fill={`url(#${id}-relleno)`} />
            )}
          </svg>
          {acrilico && (
            <rect x={r.x} y={r.y} width={r.ancho} height={r.alto} fill={`url(#${id}-brillo)`} />
          )}
        </g>
      )}
    </svg>
  );
}
