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
  /** Solo decoración (la cinta de enmarcar). Nunca lleva texto. */
  cinta: string;
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
    bajada: string;
    fotoPortada?: FotoVitrina;
    /** Una foto por cuadro de la pared de galería, en el mismo orden. */
    galeria?: FotoVitrina[];
  };
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
    nombre: 'Áurea Estudio',
    eslogan: 'Tus fotos, convertidas en cuadros',
    prefijoPedido: 'AE',
    // Paleta «estudio de afiches de barrio» (ver DESIGN.md). Contraste verificado: texto sobre fondo
    // 15.2:1, textoSuave sobre superficie 6.3:1, fondo sobre acento 4.6:1, acentoFuerte sobre fondo 6.5:1.
    colores: {
      fondo: '#f4efe7',
      superficie: '#ebe1d5',
      texto: '#231814',
      textoSuave: '#5c4c45',
      acento: '#ca3517',
      acentoFuerte: '#a52110',
      sobreAcento: '#f4efe7',
      acentoHover: '#a52110',
      linea: '#23181426',
      lineaFuerte: '#23181440',
      cinta: '#e7d2a0',
    },
  },
  // SUPUESTO: textos de ejemplo de la marca ficticia; el taller real pone los suyos y sus fotos.
  vitrina: {
    titular: 'Tu foto, en tu pared.',
    bajada: 'Cuadros en MDF y acrílico, a tu medida. Envíos a todo Colombia.',
  },
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
