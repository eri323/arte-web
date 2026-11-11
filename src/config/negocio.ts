// Configuración del taller. Es el ÚNICO archivo que cambia de un taller a otro.
// Todo el dinero va en pesos colombianos enteros (sin decimales).

export type Promocion =
  | { tipo: 'desde'; cantidadMinima: number; precioUnitario: number } // "N o más a X c/u"
  | { tipo: 'paquete'; cantidad: number; precioPaquete: number }; // "N por X"

export type MaterialId = 'vidrio' | 'acrilico';
/** Póster del catálogo tal cual, o ilustración por encargo del vehículo del cliente. */
export type Linea = 'catalogo' | 'personalizado';

export interface Medida {
  id: string;
  /** En orientación vertical. */
  anchoCm: number;
  altoCm: number;
  precio: number;
  promocion?: Promocion;
  /** Qué lleva al frente el marco. En este taller depende de la medida: el cliente no lo elige. */
  frontal: MaterialId;
  linea: Linea;
  /** Formato alargado, para los diseños panorámicos (un carro de perfil a lo ancho). */
  panoramica?: boolean;
}
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
  /** Diseño alargado: solo se hace en las medidas panorámicas. */
  panoramico?: boolean;
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
  /** Fotos reales de cuadros ya entregados o en casa, para la portada. */
  entregas: FotoVitrina[];
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
  envio: { texto: string; tarifas: { zona: string; valor: string }[] };
  /** Tiempos de entrega que el taller promete. */
  tiempos: { texto: string; grande: string };
}

// Datos reales del catálogo de RaceTrackPosters (documento de Canva enlazado en su historia
// destacada «CATALOGO», leído el 10-nov-2026): medidas, precios, envíos, tiempos y abono.
// SUPUESTO: la orientación horizontal invierte ancho y alto y cuesta lo mismo.
export const negocio: Negocio = {
  marca: {
    nombre: 'RaceTrack Posters',
    eslogan: 'Tu carro o tu moto, convertido en arte · Envíos a todo Colombia',
    prefijoPedido: 'RT',
    // La pared gris clara de sus propias fotos de producto, tinta para el texto y los marcos, y un
    // solo acento: el morado de la vuelta rápida en las pantallas de tiempos (ver DESIGN.md). El
    // color lo ponen los pósters. Contraste: texto 16,7:1, texto suave 5,9:1 y morado 5,3:1.
    colores: {
      fondo: '#efefec',
      superficie: '#e2e2df',
      texto: '#0e0e10',
      textoSuave: '#5d5d5d',
      acento: '#7a2df0',
      acentoFuerte: '#7a2df0',
      sobreAcento: '#efefec',
      acentoHover: '#6727c8',
      linea: '#0e0e1026',
      lineaFuerte: '#0e0e1040',
      cinta: '#b58cff',
    },
  },
  vitrina: {
    // Su propia frase de Instagram.
    titular: 'Tu carro,',
    titularSuave: 'convertido en arte.',
    bajada:
      'Ilustramos a mano, en digital, el carro o la moto que quieras: el tuyo o el de tus sueños. Te llega enmarcado y listo para colgar.',
  },
  // Fotos reales de sus publicaciones de Instagram (@racetrackposters), recortadas al arte del
  // póster. Excepción de la rama feat/racetrack-posters (CLAUDE.md, sección 18): son marcas y
  // pilotos reales porque es lo que el taller vende.
  // SUPUESTO: los nombres y las categorías los puso la demo leyendo cada póster, no el taller.
  catalogo: [
    {
      id: 'antonelli-w17',
      nombre: 'Kimi Antonelli · Mercedes W17',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/antonelli-w17.webp',
        alt: 'Póster del Mercedes W17 de Kimi Antonelli de perfil sobre un trazo dorado',
      },
    },
    {
      id: 'ferrari-488-pista',
      nombre: 'Ferrari 488 Pista',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/ferrari-488-pista.webp',
        alt: 'Póster de un Ferrari 488 Pista rojo con su ficha técnica',
      },
    },
    {
      id: 'porsche-911-rsr',
      nombre: 'Porsche 911 RSR',
      categoria: 'Porsche',
      foto: {
        src: '/catalogo/porsche-911-rsr.webp',
        alt: 'Póster panorámico de un Porsche 911 RSR de carreras, de perfil',
        orientacion: 'horizontal',
        panoramico: true,
      },
    },
    {
      id: 'senna-monaco-1990',
      nombre: 'Ayrton Senna · Mónaco 1990',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/senna-monaco-1990.webp',
        alt: 'Póster del McLaren de Ayrton Senna sobre el trazado de Mónaco',
      },
    },
    {
      id: 'nissan-gtr-r35',
      nombre: 'Nissan GT-R R35',
      categoria: 'JDM',
      foto: {
        src: '/catalogo/nissan-gtr-r35.webp',
        alt: 'Póster de un Nissan GT-R R35 azul con su ficha técnica',
      },
    },
    {
      id: 'nordschleife',
      nombre: 'Nürburgring Nordschleife',
      categoria: 'Circuitos',
      foto: {
        src: '/catalogo/nordschleife.webp',
        alt: 'Póster azul oscuro con el trazado del Nürburgring Nordschleife',
      },
    },
    {
      id: 'ducati-panigale',
      nombre: 'Ducati Panigale V4',
      categoria: 'Motos',
      foto: {
        src: '/catalogo/ducati-panigale.webp',
        alt: 'Póster de una Ducati Panigale V4 roja de perfil',
      },
    },
    {
      id: 'mclaren-720s',
      nombre: 'McLaren 720S',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/mclaren-720s.webp',
        alt: 'Póster de un McLaren 720S naranja con el nombre en letras grandes',
      },
    },
    {
      id: 'verstappen-red-bull',
      nombre: 'Max Verstappen · Red Bull',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/verstappen-red-bull.webp',
        alt: 'Póster con cuatro monoplazas Red Bull de Max Verstappen',
      },
    },
    {
      id: 'huracan-performante',
      nombre: 'Lamborghini Huracán Performante',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/huracan-performante.webp',
        alt: 'Póster de un Lamborghini Huracán Performante gris',
      },
    },
    {
      id: 'skyline-r34',
      nombre: 'Nissan Skyline GT-R R34',
      categoria: 'JDM',
      foto: {
        src: '/catalogo/skyline-r34.webp',
        alt: 'Póster horizontal de un Nissan Skyline GT-R R34 azul',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'porsche-boxster-s',
      nombre: 'Porsche Boxster S',
      categoria: 'Porsche',
      foto: {
        src: '/catalogo/porsche-boxster-s.webp',
        alt: 'Póster de un Porsche Boxster S blanco descapotado',
      },
    },
    {
      id: 'circuito-monaco',
      nombre: 'Circuit de Monaco',
      categoria: 'Circuitos',
      foto: {
        src: '/catalogo/circuito-monaco.webp',
        alt: 'Póster azul oscuro con el trazado del circuito de Mónaco',
      },
    },
    {
      id: 'ford-mustang',
      nombre: 'Ford Mustang',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/ford-mustang.webp',
        alt: 'Póster de un Ford Mustang amarillo de perfil',
      },
    },
    {
      id: 'montoya',
      nombre: 'Juan Pablo Montoya · sus carros',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/montoya.webp',
        alt: 'Póster con los carros de carreras de Juan Pablo Montoya',
      },
    },
    {
      id: 'countach',
      nombre: 'Lamborghini Countach LP5000 QV',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/countach.webp',
        alt: 'Póster horizontal de un Lamborghini Countach blanco con las puertas abiertas',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'supra-gt500',
      nombre: 'Toyota Supra GT500',
      categoria: 'JDM',
      foto: {
        src: '/catalogo/supra-gt500.webp',
        alt: 'Póster de un Toyota Supra GT500 de carreras blanco, verde y rojo',
      },
    },
    {
      id: 'porsche-911-rsr-pink-pig',
      nombre: 'Porsche 911 RSR «Pink Pig»',
      categoria: 'Porsche',
      foto: {
        src: '/catalogo/porsche-911-rsr-pink-pig.webp',
        alt: 'Póster panorámico de un Porsche 911 RSR rosado, de perfil',
        orientacion: 'horizontal',
        panoramico: true,
      },
    },
    {
      id: 'bmw-m3-competition',
      nombre: 'BMW M3 Competition',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/bmw-m3-competition.webp',
        alt: 'Póster de un BMW M3 Competition rojo',
      },
    },
    {
      id: 'isla-de-man',
      nombre: 'Isla de Man · Snaefell Mountain',
      categoria: 'Circuitos',
      foto: {
        src: '/catalogo/isla-de-man.webp',
        alt: 'Póster negro con el trazado del circuito de la Isla de Man',
      },
    },
    {
      id: 'ferrari-enzo',
      nombre: 'Ferrari Enzo',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/ferrari-enzo.webp',
        alt: 'Póster de un Ferrari Enzo rojo de perfil',
      },
    },
    {
      id: 'lancer-evolution',
      nombre: 'Mitsubishi Lancer Evolution',
      categoria: 'JDM',
      foto: {
        src: '/catalogo/lancer-evolution.webp',
        alt: 'Póster de un Mitsubishi Lancer Evolution rojo',
      },
    },
    {
      id: 'senna-williams',
      nombre: 'Ayrton Senna · Williams FW16',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/senna-williams.webp',
        alt: 'Póster panorámico del Williams de Ayrton Senna, de perfil',
        orientacion: 'horizontal',
        panoramico: true,
      },
    },
    {
      id: 'mercedes-c63-amg',
      nombre: 'Mercedes C63 AMG',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/mercedes-c63-amg.webp',
        alt: 'Póster de un Mercedes C63 AMG plateado',
      },
    },
    {
      id: 'amg-gt-r',
      nombre: 'Mercedes-AMG GT R',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/amg-gt-r.webp',
        alt: 'Póster horizontal de un Mercedes-AMG GT R verde',
        orientacion: 'horizontal',
      },
    },
    {
      id: 'pikes-peak',
      nombre: 'Pikes Peak · Suzuki Escudo',
      categoria: 'Circuitos',
      foto: {
        src: '/catalogo/pikes-peak.webp',
        alt: 'Póster del Suzuki Escudo sobre el trazado de Pikes Peak',
      },
    },
    {
      id: 'audi-rs2-avant',
      nombre: 'Audi RS2 Avant',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/audi-rs2-avant.webp',
        alt: 'Póster de un Audi RS2 Avant azul',
      },
    },
    {
      id: 'antonelli-monaco',
      nombre: 'Kimi Antonelli · GP de Mónaco',
      categoria: 'Fórmula 1',
      foto: {
        src: '/catalogo/antonelli-monaco.webp',
        alt: 'Póster del Mercedes de Kimi Antonelli sobre el trazado de Mónaco',
      },
    },
    {
      id: 'chevrolet-blazer-rs',
      nombre: 'Chevrolet Blazer RS',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/chevrolet-blazer-rs.webp',
        alt: 'Póster de una Chevrolet Blazer RS roja',
      },
    },
    {
      id: 'gallardo-superleggera',
      nombre: 'Lamborghini Gallardo Superleggera',
      categoria: 'Superdeportivos',
      foto: {
        src: '/catalogo/gallardo-superleggera.webp',
        alt: 'Póster de un Lamborghini Gallardo Superleggera blanco',
      },
    },
    {
      id: 'mini-jcw',
      nombre: 'Mini John Cooper Works',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/mini-jcw.webp',
        alt: 'Póster de un Mini John Cooper Works gris con franjas rojas',
      },
    },
    {
      id: 'bmw-m340i',
      nombre: 'BMW M340i',
      categoria: 'Calle',
      foto: {
        src: '/catalogo/bmw-m340i.webp',
        alt: 'Póster de un BMW M340i plateado de perfil',
      },
    },
  ],
  entregas: [
    {
      src: '/clientes/gt3-rs-blanco.webp',
      alt: 'Cuadro de un Porsche 911 GT3 RS blanco apoyado sobre una mesa de madera',
    },
    { src: '/clientes/f40.webp', alt: 'Cuadro de un Ferrari F40 negro sobre un piso de madera' },
    {
      src: '/clientes/montoya-monaco.webp',
      alt: 'Cuadro del Williams de Juan Pablo Montoya, ganador en Mónaco 2003',
    },
    {
      src: '/clientes/gsx-r.webp',
      alt: 'Cuadro de una Suzuki GSX-R azul apoyado en el piso de una sala',
    },
    { src: '/clientes/720s.webp', alt: 'Cuadro de un McLaren 720S rojo sobre una mesa' },
    { src: '/clientes/senna-carros.webp', alt: 'Cuadro con todos los monoplazas de Ayrton Senna' },
    { src: '/clientes/488-pista.webp', alt: 'Cuadro de un Ferrari 488 Pista rojo sobre una mesa' },
    {
      src: '/clientes/senna-monaco.webp',
      alt: 'Cuadro del McLaren de Senna en Mónaco, apoyado junto a una ventana',
    },
    {
      src: '/clientes/gt3-rs-negro.webp',
      alt: 'Cuadro de un Porsche 911 GT3 RS negro en una sala',
    },
    {
      src: '/clientes/hamilton-ferrari.webp',
      alt: 'Cuadro del Ferrari de Lewis Hamilton sobre una mesa',
    },
    {
      src: '/clientes/911-rsr.webp',
      alt: 'Cuadro de un Porsche 911 RSR de carreras sobre una mesa',
    },
    {
      src: '/clientes/gtr-rojo.webp',
      alt: 'Cuadro de un Nissan GT-R R35 rojo sobre un piso de madera',
    },
  ],
  redes: { instagram: 'racetrackposters' },
  // Medidas en vertical (ancho × alto). El catálogo las escribe al revés («25x20»).
  // Sin promociones: el catálogo no anuncia ninguna.
  medidas: [
    { id: '13x18', anchoCm: 13, altoCm: 18, precio: 42000, frontal: 'vidrio', linea: 'catalogo' },
    { id: '20x25', anchoCm: 20, altoCm: 25, precio: 58000, frontal: 'vidrio', linea: 'catalogo' },
    { id: '30x38', anchoCm: 30, altoCm: 38, precio: 75000, frontal: 'vidrio', linea: 'catalogo' },
    {
      id: '20x50',
      anchoCm: 20,
      altoCm: 50,
      precio: 78000,
      frontal: 'vidrio',
      linea: 'catalogo',
      panoramica: true,
    },
    { id: '30x40', anchoCm: 30, altoCm: 40, precio: 78000, frontal: 'acrilico', linea: 'catalogo' },
    {
      id: '35x50-acrilico',
      anchoCm: 35,
      altoCm: 50,
      precio: 95000,
      frontal: 'acrilico',
      linea: 'catalogo',
    },
    { id: '35x50', anchoCm: 35, altoCm: 50, precio: 140000, frontal: 'vidrio', linea: 'catalogo' },
    { id: '50x70', anchoCm: 50, altoCm: 70, precio: 265000, frontal: 'vidrio', linea: 'catalogo' },
    {
      id: '50x100',
      anchoCm: 50,
      altoCm: 100,
      precio: 375000,
      frontal: 'vidrio',
      linea: 'catalogo',
      panoramica: true,
    },
    {
      id: '70x100',
      anchoCm: 70,
      altoCm: 100,
      precio: 475000,
      frontal: 'vidrio',
      linea: 'catalogo',
    },
    // Personalizados: el vehículo del cliente, ilustrado por encargo. No se ofrecen en 13×18 ni
    // en 50×100.
    // SUPUESTO: 35×50 con vidrio a $160.000. El catálogo lo lista dos veces, a $160.000 y a
    // $150.000; se deja el más alto hasta que el taller lo aclare.
    {
      id: 'p-20x25',
      anchoCm: 20,
      altoCm: 25,
      precio: 65000,
      frontal: 'vidrio',
      linea: 'personalizado',
    },
    {
      id: 'p-30x38',
      anchoCm: 30,
      altoCm: 38,
      precio: 80000,
      frontal: 'vidrio',
      linea: 'personalizado',
    },
    {
      id: 'p-20x50',
      anchoCm: 20,
      altoCm: 50,
      precio: 85000,
      frontal: 'vidrio',
      linea: 'personalizado',
      panoramica: true,
    },
    {
      id: 'p-30x40',
      anchoCm: 30,
      altoCm: 40,
      precio: 85000,
      frontal: 'acrilico',
      linea: 'personalizado',
    },
    {
      id: 'p-35x50-acrilico',
      anchoCm: 35,
      altoCm: 50,
      precio: 105000,
      frontal: 'acrilico',
      linea: 'personalizado',
    },
    {
      id: 'p-35x50',
      anchoCm: 35,
      altoCm: 50,
      precio: 160000,
      frontal: 'vidrio',
      linea: 'personalizado',
    },
    {
      id: 'p-50x70',
      anchoCm: 50,
      altoCm: 70,
      precio: 270000,
      frontal: 'vidrio',
      linea: 'personalizado',
    },
    {
      id: 'p-70x100',
      anchoCm: 70,
      altoCm: 100,
      precio: 480000,
      frontal: 'vidrio',
      linea: 'personalizado',
    },
  ],
  materiales: [
    {
      id: 'vidrio',
      nombre: 'Vidrio',
      descripcion: 'Marco negro con vidrio al frente.',
      recargo: 0,
    },
    {
      id: 'acrilico',
      nombre: 'Acrílico',
      descripcion: 'Marco negro con acrílico al frente: más liviano y no se quiebra.',
      recargo: 0,
    },
  ],
  orientaciones: ['vertical', 'horizontal'],
  // SUPUESTO: buena ≥ 150 dpi y regular ≥ 100 dpi; por debajo es baja. Solo se usa para avisar si
  // la foto de referencia de un personalizado es muy pequeña.
  resolucion: { buena: 150, regular: 100 },
  archivo: { tamanoMaxMB: 25, tipos: ['image/jpeg', 'image/png', 'image/webp'] },
  // El WhatsApp del taller (+57 302 6423318): los botones de WhatsApp y el pedido abren este chat.
  // Si se deja vacío, el sitio queda en modo demo: no abre ningún chat, solo muestra el mensaje.
  whatsapp: { numero: '573026423318' },
  // «Para iniciar proceso de diseño se debe realizar un abono del 50%» (catálogo).
  pagos: { porcentajeAbono: 50 },
  envio: {
    texto: 'Desde $8.000 según tu ciudad',
    tarifas: [
      { zona: 'Medellín y área metropolitana', valor: '$8.000 a $15.000' },
      { zona: 'Cali, Pereira y Manizales', valor: '$13.000' },
      { zona: 'Otras ciudades', valor: '$16.500' },
    ],
  },
  tiempos: {
    texto: '3 a 4 días, con impresión y enmarcado',
    grande: 'De 35×50 cm en adelante, 4 a 6 días',
  },
};
