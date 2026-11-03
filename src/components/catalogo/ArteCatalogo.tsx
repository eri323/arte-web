import { useId, type ReactNode } from 'react';

// Arte generado en SVG para los diseños de ejemplo del catálogo (regla 2: nada de carátulas ni
// fotos de terceros). Lienzo de 600×800 (3:4) que llena su contenedor. Al ser vectorial, se ve
// bien en cualquier medida. Un taller real reemplaza esto con las fotos de su catálogo
// (`negocio.catalogo[].foto`).

const FUENTE = 'var(--font-display)';

type Estilo =
  | { d: 'sol'; bg: string; fg: string; t: string; s: string }
  | { d: 'billete'; t: string; s: string }
  | { d: 'neon'; fg: string; lineas: string[]; s: string; size?: number }
  | { d: 'tipo'; bg: string; fg: string; ac: string; lineas: string[]; s: string }
  | { d: 'pop'; bg: string; dot: string; fg: string; ac: string; t: string }
  | {
      d: 'sunset';
      cielo: string[];
      sol: string;
      bg: string;
      fg: string;
      t: string;
      s: string;
    }
  | { d: 'vinilo'; bg: string; fg: string; ac: string; t: string; s: string };

// SUPUESTO: diseños de ejemplo, inventados para la demo.
const ESTILOS: Record<string, Estilo> = {
  'cuatro-cuatros': { d: 'sol', bg: '#0d0b09', fg: '#E7B94C', t: '444', s: 'MIDAS' },
  'verde-billete': { d: 'billete', t: '100', s: 'LUJO SILENCIOSO' },
  'no-pares': { d: 'neon', fg: '#FF2D20', lineas: ['NO', 'PARES'], s: 'DISCIPLINA DIARIA' },
  disciplina: {
    d: 'tipo',
    bg: '#0d0b09',
    fg: '#F3ECE0',
    ac: '#E7B94C',
    lineas: ['HAZLO', 'AUNQUE', 'NADIE', 'MIRE'],
    s: '— MIDAS ATELIER',
  },
  'chicle-pop': { d: 'pop', bg: '#7fd7e8', dot: '#3aa9c4', fg: '#ff5fa2', ac: '#fff', t: 'POP!' },
  'boom-comic': {
    d: 'pop',
    bg: '#ffd23f',
    dot: '#f29e0c',
    fg: '#ef3e36',
    ac: '#ffd23f',
    t: '¡BOOM!',
  },
  'escena-final': {
    d: 'tipo',
    bg: '#8e1410',
    fg: '#f5e9df',
    ac: '#0b0a09',
    lineas: ['ESCENA', 'FINAL', 'EN', 'ROJO'],
    s: 'UNA PELÍCULA DE TU VIDA',
  },
  'sala-oscura': {
    d: 'neon',
    fg: '#E7B94C',
    lineas: ['ACCIÓN'],
    size: 150,
    s: 'TOMA 1 · ESCENA 4',
  },
  'riff-pesado': { d: 'neon', fg: '#b84dff', lineas: ['RIFF', 'PESADO'], s: 'VOLUMEN AL MÁXIMO' },
  'lado-a': { d: 'vinilo', bg: '#141210', fg: '#F3ECE0', ac: '#FF2D20', t: 'LADO A', s: '33 RPM' },
  ronin: {
    d: 'sunset',
    cielo: ['#2a0a12', '#7a1020', '#e2462e'],
    sol: '#ffce6b',
    bg: '#120608',
    fg: '#ffe9d0',
    t: 'RONIN',
    s: 'EL CAMINO SOLITARIO',
  },
  sakura: {
    d: 'sunset',
    cielo: ['#fbd1e1', '#f59ec0', '#a95c9c'],
    sol: '#fff3f7',
    bg: '#3a1e3d',
    fg: '#3a1e3d',
    t: 'SAKURA',
    s: 'PRIMAVERA ETERNA',
  },
};

/** Si un taller agrega un diseño sin foto ni arte propio, se pinta este. */
const GENERICO: Estilo = { d: 'sol', bg: '#0d0b09', fg: '#E7B94C', t: '★', s: '' };

/** Tamaño de letra para que `texto` no pase de `ancho` (Big Shoulders mide ~0,5 em por letra). */
function ajustar(texto: string, size: number, ancho = 520): number {
  return Math.min(size, ancho / (Math.max(texto.length, 1) * 0.5));
}

function Texto(props: {
  x?: number;
  y: number;
  size: number;
  color: string;
  anchor?: 'middle' | 'start';
  peso?: number;
  children: string;
}) {
  const { x = 300, y, size, color, anchor = 'middle', peso = 900, children } = props;
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={ajustar(children, size)}
      fontWeight={peso}
      textAnchor={anchor}
      style={{ fontFamily: FUENTE }}
    >
      {children}
    </text>
  );
}

function puntoPolar(cx: number, cy: number, r: number, grados: number): string {
  const a = (grados * Math.PI) / 180;
  return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
}

// Los anillos del billete se calculan una sola vez (son iguales en todos los cuadros).
const ANILLOS = Array.from({ length: 22 }, (_, k) => {
  const r = 20 + k * 18;
  const puntos: string[] = [];
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
    const rr = r + Math.sin(a * 12) * 6;
    puntos.push(
      `${(300 + Math.cos(a) * rr).toFixed(1)},${(400 + Math.sin(a) * rr * 1.3).toFixed(1)}`,
    );
  }
  return `M${puntos.join('L')}Z`;
});

function dibujar(e: Estilo, id: string): ReactNode {
  switch (e.d) {
    case 'sol':
      return (
        <>
          <rect width="600" height="800" fill={e.bg} />
          {Array.from({ length: 18 }, (_, i) => (
            <polygon
              key={i}
              points={`300,360 ${puntoPolar(300, 360, 760, i * 20)} ${puntoPolar(300, 360, 760, i * 20 + 10)}`}
              fill={e.fg}
            />
          ))}
          <circle cx="300" cy="360" r="120" fill={e.bg} />
          <Texto y={410} size={150} color={e.fg}>
            {e.t}
          </Texto>
          <Texto y={740} size={44} color={e.fg}>
            {e.s}
          </Texto>
        </>
      );
    case 'billete':
      return (
        <>
          <rect width="600" height="800" fill="#1f3a2c" />
          <path d={ANILLOS.join('')} fill="none" stroke="rgba(210,230,200,.22)" strokeWidth="1.2" />
          <rect
            x="30"
            y="30"
            width="540"
            height="740"
            fill="none"
            stroke="#E7B94C"
            strokeWidth="6"
          />
          <rect
            x="46"
            y="46"
            width="508"
            height="708"
            fill="none"
            stroke="#E7B94C"
            strokeWidth="1.5"
          />
          <Texto y={470} size={230} color="#e9e2c8">
            {e.t}
          </Texto>
          <Texto y={120} size={48} color="#E7B94C">
            {e.s}
          </Texto>
          <Texto y={720} size={26} color="#cfd8c4" peso={800}>
            CUATRO · CUATRO · CUATRO
          </Texto>
        </>
      );
    case 'neon': {
      const size = Math.min(...e.lineas.map((l) => ajustar(l, e.size ?? 170, 540)));
      const ys = e.lineas.map((_, i, a) => 400 + (i - (a.length - 1) / 2) * size * 0.92 + 60);
      const lineas = (stroke: string, ancho: number) =>
        e.lineas.map((l, i) => (
          <text
            key={l}
            x="300"
            y={ys[i]}
            fontSize={size}
            fontWeight={900}
            textAnchor="middle"
            fill="none"
            stroke={stroke}
            strokeWidth={ancho}
            style={{ fontFamily: FUENTE }}
          >
            {l}
          </text>
        ));
      return (
        <>
          <defs>
            <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#120707" />
              <stop offset="1" stopColor="#050303" />
            </linearGradient>
            <filter id={`${id}-n`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          <rect width="600" height="800" fill={`url(#${id}-f)`} />
          <g filter={`url(#${id}-n)`}>{lineas(e.fg, 10)}</g>
          {lineas(e.fg, 4)}
          {lineas('#fff', 1.5)}
          <Texto y={740} size={30} color="rgba(255,255,255,.6)" peso={800}>
            {e.s}
          </Texto>
        </>
      );
    }
    case 'tipo':
      return (
        <>
          <rect width="600" height="800" fill={e.bg} />
          <rect width="600" height="14" fill={e.fg} />
          <rect y="786" width="600" height="14" fill={e.fg} />
          {e.lineas.map((l, i) => (
            <Texto
              key={l}
              x={40}
              y={200 + i * 150}
              size={190}
              anchor="start"
              color={i === e.lineas.length - 1 ? e.ac : e.fg}
            >
              {l}
            </Texto>
          ))}
          <Texto x={40} y={750} size={30} anchor="start" color={e.fg} peso={800}>
            {e.s}
          </Texto>
        </>
      );
    case 'pop':
      // Los puntos de trama se achican hacia abajo: cuatro franjas con un patrón cada una.
      return (
        <>
          <defs>
            {[6.5, 5, 3.5, 2].map((r, i) => (
              <pattern
                key={r}
                id={`${id}-p${i}`}
                width="18"
                height="36"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="0" cy="0" r={r} fill={e.dot} />
                <circle cx="18" cy="0" r={r} fill={e.dot} />
                <circle cx="9" cy="18" r={r} fill={e.dot} />
                <circle cx="0" cy="36" r={r} fill={e.dot} />
                <circle cx="18" cy="36" r={r} fill={e.dot} />
              </pattern>
            ))}
          </defs>
          <rect width="600" height="800" fill={e.bg} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} y={i * 198} width="600" height="206" fill={`url(#${id}-p${i})`} />
          ))}
          <circle cx="320" cy="330" r="190" fill={e.fg} stroke="#111" strokeWidth="10" />
          <circle cx="250" cy="260" r="48" fill="rgba(255,255,255,.55)" />
          <rect
            x="50"
            y="570"
            width="500"
            height="120"
            fill="#111"
            transform="rotate(-3.4 300 640)"
          />
          <Texto y={665} size={120} color={e.ac}>
            {e.t}
          </Texto>
        </>
      );
    case 'sunset':
      return (
        <>
          <defs>
            <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
              {e.cielo.map((c, i, a) => (
                <stop key={c} offset={i / (a.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <rect width="600" height="800" fill={`url(#${id}-c)`} />
          <circle cx="300" cy="420" r="170" fill={e.sol} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={440 + i * 26} width="600" height={6 + i * 2.4} fill={e.bg} />
          ))}
          <path d="M0 800 L0 600 L140 520 L260 610 L400 500 L600 620 L600 800Z" fill={e.bg} />
          <Texto y={150} size={120} color={e.fg}>
            {e.t}
          </Texto>
          <Texto y={750} size={30} color={e.fg} peso={800}>
            {e.s}
          </Texto>
        </>
      );
    case 'vinilo':
      return (
        <>
          <rect width="600" height="800" fill={e.bg} />
          {Array.from({ length: 35 }, (_, i) => 250 - i * 6).map((r) => (
            <circle
              key={r}
              cx="300"
              cy="330"
              r={r}
              fill="none"
              stroke={r % 12 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.12)'}
            />
          ))}
          <circle cx="300" cy="330" r="80" fill={e.ac} />
          <circle cx="300" cy="330" r="8" fill={e.bg} />
          <Texto y={680} size={130} color={e.fg}>
            {e.t}
          </Texto>
          <Texto y={745} size={28} color={e.ac} peso={800}>
            {e.s}
          </Texto>
        </>
      );
  }
}

interface Props {
  disenoId: string;
  /** Nombre del diseño. Sin él, el arte es decorativo (aria-hidden). */
  titulo?: string;
  className?: string;
}

export default function ArteCatalogo({ disenoId, titulo, className = '' }: Props) {
  const id = `arte-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const estilo = ESTILOS[disenoId] ?? GENERICO;
  return (
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      className={`block size-full ${className}`}
    >
      {dibujar(estilo, id)}
    </svg>
  );
}
