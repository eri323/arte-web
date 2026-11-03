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
  /** La misma foto en alta resolución, para pantallas grandes y la pared. */
  srcGrande?: string;
  alt: string;
  /** Qué parte de la foto se ve cuando se recorta (object-position), por ejemplo '40% 50%'. */
  posicion?: string;
  /** Forma del cuadro de la foto. La pared lo muestra así al elegirlo. Por defecto, vertical. */
  orientacion?: Orientacion;
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
  // Fotos reales: pósters que el taller mandó a hacer y cuadros de su Instagram (@midasatelier444).
  // Excepción de la rama feat/midas-atelier (CLAUDE.md, sección 18): hay carátulas de álbumes y
  // fotogramas de películas porque es lo que el taller vende de verdad.
  // SUPUESTO: nombres y categorías los puso la demo, no el taller. El precio es el de la medida
  // elegida (no hay recargo por diseño).
  catalogo: [
    {
      id: 'a-mis-20',
      nombre: 'A mis 20',
      categoria: 'Música',
      foto: {
        src: '/catalogo/a-mis-20-800.webp',
        srcGrande: '/catalogo/a-mis-20-1600.webp',
        alt: 'Póster del álbum A mis 20 con la lista de canciones',
      },
    },
    {
      id: 'el-mundo-es-tuyo',
      nombre: 'El mundo es tuyo',
      categoria: 'Cine',
      foto: {
        src: '/catalogo/el-mundo-es-tuyo-800.webp',
        srcGrande: '/catalogo/el-mundo-es-tuyo-1600.webp',
        alt: 'Cuadro pop art de un gánster de traje blanco con un letrero de neón',
        posicion: '52% 50%',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'estatua-pop',
      nombre: 'Estatua pop',
      categoria: 'Urbano',
      foto: {
        src: '/catalogo/estatua-pop-800.webp',
        srcGrande: '/catalogo/estatua-pop-1600.webp',
        alt: 'Cuadro de una estatua griega con audífonos y gafas rosadas haciendo una bomba de chicle',
      },
    },
    {
      id: 'fight-club',
      nombre: 'Fight Club',
      categoria: 'Cine',
      foto: {
        src: '/catalogo/fight-club-800.webp',
        srcGrande: '/catalogo/fight-club-1600.webp',
        alt: 'Póster de la película Fight Club con la lista de sus reglas',
      },
    },
    {
      id: 'feliz-cumpleanos-ferxxo',
      nombre: 'Feliz Cumpleaños Ferxxo',
      categoria: 'Música',
      foto: {
        src: '/catalogo/feliz-cumpleanos-ferxxo-800.webp',
        srcGrande: '/catalogo/feliz-cumpleanos-ferxxo-1600.webp',
        alt: 'Póster de álbum en forma de chat, con la lista de canciones',
      },
    },
    {
      id: 'frase-neon',
      nombre: '¿Y si todo sale bien?',
      categoria: 'Urbano',
      foto: {
        src: '/catalogo/frase-neon-800.webp',
        srcGrande: '/catalogo/frase-neon-1600.webp',
        alt: 'Cuadro con una frase escrita a mano sobre un periódico, con luz LED azul',
      },
    },
    {
      id: 'sagrado-corazon',
      nombre: 'Sagrado Corazón',
      categoria: 'Arte',
      foto: {
        src: '/catalogo/sagrado-corazon-800.webp',
        srcGrande: '/catalogo/sagrado-corazon-1600.webp',
        alt: 'Cuadro del Sagrado Corazón de Jesús con un halo dorado',
      },
    },
    {
      id: 'sayonara',
      nombre: 'Sayonara',
      categoria: 'Música',
      foto: {
        src: '/catalogo/sayonara-800.webp',
        srcGrande: '/catalogo/sayonara-1600.webp',
        alt: 'Póster del álbum Sayonara con la lista de canciones',
      },
    },
    {
      id: 'cien-dolares',
      nombre: 'Cien dólares',
      categoria: 'Urbano',
      foto: {
        src: '/catalogo/cien-dolares-800.webp',
        srcGrande: '/catalogo/cien-dolares-1600.webp',
        alt: 'Cuadro de un billete de cien dólares con luz LED blanca',
        posicion: '42% 50%',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'tu-mascota',
      nombre: 'Tu mascota',
      categoria: 'Mascotas',
      foto: {
        src: '/catalogo/tu-mascota-800.webp',
        srcGrande: '/catalogo/tu-mascota-1600.webp',
        alt: 'Cuadro con la foto de un gato atigrado mirando hacia arriba',
      },
    },
    {
      id: 'la-bomba-de-ziroshima',
      nombre: 'La bomba de Ziroshima',
      categoria: 'Música',
      foto: {
        src: '/catalogo/la-bomba-de-ziroshima-800.webp',
        srcGrande: '/catalogo/la-bomba-de-ziroshima-1600.webp',
        alt: 'Cuadro de álbum al estilo de un grabado japonés, con un monje en un lago',
      },
    },
    {
      id: 'la-chilena',
      nombre: 'La chilena',
      categoria: 'Deportes',
      foto: {
        src: '/catalogo/la-chilena-800.webp',
        srcGrande: '/catalogo/la-chilena-1600.webp',
        alt: 'Cuadro de un futbolista haciendo una chilena en un estadio lleno',
        posicion: '55% 50%',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'fight-club-fotocopia',
      nombre: 'Fight Club en fotocopia',
      categoria: 'Cine',
      foto: {
        src: '/catalogo/fight-club-fotocopia-800.webp',
        srcGrande: '/catalogo/fight-club-fotocopia-1600.webp',
        alt: 'Póster de Fight Club con textura de fotocopia en blanco y negro',
      },
    },
    {
      id: 'set-anime',
      nombre: 'Set anime',
      categoria: 'Anime',
      foto: {
        src: '/catalogo/set-anime-800.webp',
        srcGrande: '/catalogo/set-anime-1600.webp',
        alt: 'Set de cinco cuadros de anime montados juntos en la pared',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'la-creacion',
      nombre: 'La creación',
      categoria: 'Arte',
      foto: {
        src: '/catalogo/la-creacion-800.webp',
        srcGrande: '/catalogo/la-creacion-1600.webp',
        alt: 'Cuadro de dos manos a punto de tocarse, en tonos azules',
        orientacion: 'horizontal',
      },
    },
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
