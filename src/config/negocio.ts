// Configuración del taller. Es el ÚNICO archivo que cambia de un taller a otro.
// Todo el dinero va en pesos colombianos enteros (sin decimales).

export type Promocion =
  | { tipo: 'desde'; cantidadMinima: number; precioUnitario: number } // "N o más a X c/u"
  | { tipo: 'paquete'; cantidad: number; precioPaquete: number }; // "N por X"

export interface Medida {
  id: string;
  /** En orientación vertical. */
  anchoCm: number;
  altoCm: number;
  precio: number;
  promocion?: Promocion;
}

export type MaterialId = 'mdf' | 'acrilico';
export type Orientacion = 'vertical' | 'horizontal';

export interface Material {
  id: MaterialId;
  nombre: string;
  descripcion: string;
  recargo: number;
}

export interface ColoresMarca {
  /** La pared: fondo general. */
  fondo: string;
  /** Bandas y paneles. */
  superficie: string;
  texto: string;
  textoSuave: string;
  /** Color de firma: fondo de la portada y del cierre, botón principal. */
  acento: string;
  /** Hover del botón y texto de acento en tamaño normal (contraste AA sobre el fondo). */
  acentoFuerte: string;
  /** Texto encima del color de firma (botones, portada). Se elige el que más contraste dé. */
  sobreAcento: string;
  /** Botón con el cursor encima: se aleja del texto del botón, así el contraste sube. */
  acentoHover: string;
  /** Bordes y divisores. */
  linea: string;
  lineaFuerte: string;
  /** Solo decoración (la cinta de enmarcar, brillos). Nunca lleva texto. */
  cinta: string;
}

/** Un diseño listo del catálogo del taller. Sin `foto` se pinta el arte generado de ese `id`. */
export interface DisenoCatalogo {
  id: string;
  nombre: string;
  categoria: string;
  foto?: FotoVitrina;
}

export interface FotoVitrina {
  /** Ruta dentro de public/, por ejemplo '/vitrina/portada.jpg'. */
  src: string;
  alt: string;
}

export interface Negocio {
  marca: { nombre: string; eslogan: string; prefijoPedido: string; colores: ColoresMarca };
  /**
   * Textos y fotos de la portada. Las fotos son propias del taller (nunca de terceros); si faltan,
   * se muestra arte generado en SVG.
   */
  vitrina: {
    titular: string;
    /** Segunda parte del titular, en gris. */
    titularSuave?: string;
    bajada: string;
    fotoPortada?: FotoVitrina;
    /** Una foto por cuadro de la pared de galería, en el mismo orden. */
    galeria?: FotoVitrina[];
  };
  /** Diseños listos para pedir sin foto propia. Vacío = solo cuadros personalizados. */
  catalogo: DisenoCatalogo[];
  redes: { instagram?: string };
  medidas: Medida[];
  materiales: Material[];
  orientaciones: Orientacion[];
  /** dpi mínimos para cada nivel de calidad. */
  resolucion: { buena: number; regular: number };
  archivo: { tamanoMaxMB: number; tipos: string[] };
  /** Formato internacional sin "+" (57XXXXXXXXXX). Vacío = modo demo. */
  whatsapp: { numero: string };
  pagos: { porcentajeAbono: number };
  envio: { texto: string };
}

// SUPUESTO: las promociones aplican por medida, sumando la cantidad de todos los ítems de esa
// medida aunque tengan fotos distintas. Las medidas distintas no se combinan entre sí.
// SUPUESTO: para 'paquete' el total es floor(n / cantidad) × precioPaquete + (n % cantidad) × precio.
// SUPUESTO: la orientación horizontal invierte ancho y alto y cuesta lo mismo.
export const negocio: Negocio = {
  marca: {
    nombre: 'Midas Atelier',
    eslogan: 'Cuadros en MDF y acrílico · Envíos a todo Colombia',
    prefijoPedido: 'MA',
    // Tienda de arte: fondo gris neutro para que manden los cuadros, tinta como color principal
    // y el oro del logo para los acentos (ver DESIGN.md). Contraste verificado: texto 17,6:1,
    // texto suave 6:1, acentoFuerte (oro para texto pequeño) 5,4:1 y el oro contra el fondo 3,2:1.
    colores: {
      fondo: '#f2f2f0',
      superficie: '#e7e7e3',
      texto: '#0b0a09',
      textoSuave: '#5c5b57',
      acento: '#b07d1f',
      acentoFuerte: '#7d5d1b',
      sobreAcento: '#0b0a09',
      acentoHover: '#c39a4c',
      linea: '#0b0a0924',
      lineaFuerte: '#0b0a0940',
      cinta: '#e3b54a',
    },
  },
  vitrina: {
    titular: 'Tu espacio,',
    titularSuave: 'a tu estilo.',
    bajada:
      'Inspírate con nuestros diseños o crea uno desde cero. Lo hacemos a mano y lo enviamos a todo Colombia.',
  },
  // SUPUESTO: diseños, nombres y categorías de ejemplo, con arte generado en SVG. El taller pone las
  // fotos reales de su catálogo en `foto`. El precio es el de la medida elegida (no hay recargo por
  // diseño).
  catalogo: [
    { id: 'cuatro-cuatros', nombre: 'Cuatro Cuatros', categoria: 'Lujo' },
    { id: 'verde-billete', nombre: 'Verde Billete', categoria: 'Lujo' },
    { id: 'no-pares', nombre: 'No Pares', categoria: 'Motivación' },
    { id: 'disciplina', nombre: 'Disciplina', categoria: 'Motivación' },
    { id: 'chicle-pop', nombre: 'Chicle Pop', categoria: 'Pop art' },
    { id: 'boom-comic', nombre: 'Boom Cómic', categoria: 'Pop art' },
    { id: 'escena-final', nombre: 'Escena Final', categoria: 'Cine' },
    { id: 'sala-oscura', nombre: 'Sala Oscura', categoria: 'Cine' },
    { id: 'riff-pesado', nombre: 'Riff Pesado', categoria: 'Música' },
    { id: 'lado-a', nombre: 'Lado A', categoria: 'Música' },
    { id: 'ronin', nombre: 'Ronin', categoria: 'Anime' },
    { id: 'sakura', nombre: 'Sakura', categoria: 'Anime' },
  ],
  redes: { instagram: 'midasatelier444' },
  medidas: [
    {
      id: '20x27',
      anchoCm: 20,
      altoCm: 27,
      precio: 30000,
      promocion: { tipo: 'desde', cantidadMinima: 5, precioUnitario: 15000 },
    },
    {
      id: '30x40',
      anchoCm: 30,
      altoCm: 40,
      precio: 60000,
      promocion: { tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 },
    },
    {
      id: '45x60',
      anchoCm: 45,
      altoCm: 60,
      precio: 80000,
      promocion: { tipo: 'paquete', cantidad: 2, precioPaquete: 130000 },
    },
    { id: '60x80', anchoCm: 60, altoCm: 80, precio: 130000 },
    { id: '90x120', anchoCm: 90, altoCm: 120, precio: 250000 },
    { id: '120x160', anchoCm: 120, altoCm: 160, precio: 330000 },
  ],
  // SUPUESTO: el material no cambia el precio (recargo 0 en los dos).
  materiales: [
    {
      id: 'mdf',
      nombre: 'MDF',
      descripcion: 'Acabado mate, con canto oscuro. Resistente y liviano.',
      recargo: 0,
    },
    {
      id: 'acrilico',
      nombre: 'Acrílico',
      descripcion: 'Acabado brillante que realza los colores.',
      recargo: 0,
    },
  ],
  orientaciones: ['vertical', 'horizontal'],
  // SUPUESTO: buena ≥ 150 dpi y regular ≥ 100 dpi; por debajo es baja. Un taller real podría
  // ajustarlos, porque los formatos grandes se miran de más lejos.
  resolucion: { buena: 150, regular: 100 },
  archivo: { tamanoMaxMB: 25, tipos: ['image/jpeg', 'image/png', 'image/webp'] },
  // SUPUESTO: número vacío = modo demo; no se abre ningún chat, solo se muestra el mensaje.
  whatsapp: { numero: '' },
  // SUPUESTO: abono = Math.ceil(total × porcentajeAbono / 100) y saldo = total − abono.
  pagos: { porcentajeAbono: 50 },
  envio: { texto: 'Se cotiza por WhatsApp según tu ciudad' },
};
