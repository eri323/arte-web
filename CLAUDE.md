# arte-web: plataforma demo para talleres de cuadros personalizados

Contexto y reglas para Claude Code. **Léelo completo antes de escribir código.**

- **Estado:** el repo `eri323/arte-web` está vacío. Empieza por el hito **H0** (sección 13).
- **Fecha de referencia:** noviembre de 2026.

---

## 1. Qué es y por qué existe

Muchos talleres de Colombia imprimen cuadros personalizados en **MDF o acrílico** a partir de la foto que manda el cliente. Venden por **Instagram** y cierran los pedidos por **WhatsApp**. Ese proceso tiene dos cuellos de botella:

1. **Antes de la venta:** el cliente tiene que preguntar por chat las medidas, los precios, cuánto queda con promoción, si su foto sirve para la medida que quiere y cómo se paga. El taller responde lo mismo una y otra vez.
2. **Después de la venta:** el pago se hace en dos partes (50% de abono y 50% antes de enviar). El cliente no sabe en qué va su cuadro y tiene que escribir para preguntar.

Este proyecto es una **plataforma demo, con una marca ficticia**, que resuelve las dos cosas:

- un **configurador**: el cliente sube su foto, la recorta, elige medida, material y cantidad, ve cómo queda en una pared, recibe un aviso de calidad y ve el precio con promociones;
- un **pedido** que llega al taller por WhatsApp con todo resumido;
- un **seguimiento** donde el cliente consulta el estado, el abono, el saldo y las notas del taller;
- un **panel del taller** para actualizar estados, pagos y precios.

Debe poder **reutilizarse para cualquier taller** cambiando un solo archivo de configuración (`src/config/negocio.ts`).

## 2. Con quién trabajas

- **Erick:** desarrollador Full Stack Junior con experiencia previa en QA. Trabaja en **Windows**, desde la terminal de **Antigravity**.
- **Está aprendiendo.** Cuando tomes una decisión técnica importante, explica en una o dos líneas **por qué**. No expliques lo obvio.
- **Idioma:** responde en español, de forma directa. El código usa identificadores en español para el dominio (`precios`, `pedido`, `medida`) y en inglés para lo técnico estándar.
- **Pregunta antes de:**
  - agregar dependencias que no estén en la sección 4;
  - cambiar el stack;
  - tocar la configuración de git o de cuentas;
  - borrar archivos que no creaste tú.
- **Él se encarga del despliegue.** Tú no despliegas.

## 3. Reglas que no se rompen

1. **Marca ficticia.**
   - No uses nombres, logos, fotos ni textos de negocios reales.
   - Antes de terminar H0, busca en la web que el nombre de ejemplo no sea un negocio real de cuadros en Colombia. Si coincide, propón otro.
   - En el footer va visible: "Demo · marca ficticia".
2. **Sin carátulas de artistas ni APIs de música.** No uses las APIs de Spotify ni de Apple/iTunes para traer portadas: sus términos no permiten ese uso comercial. Las imágenes de la galería son generadas (SVG o CSS) o propias.
3. **Fase 1 sin backend.** Nada de Supabase, servidores, `.env` ni secretos. Todo corre en el navegador y la foto del cliente **no sale de su equipo**.
4. **No inventes datos de negocio.**
   - El envío no tiene precio inventado: se muestra "se cotiza por WhatsApp según tu ciudad".
   - Todo supuesto va marcado en el código con `// SUPUESTO:` y la razón.
5. **El dinero va en pesos enteros** (`number` entero, sin decimales ni floats). Se formatea con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
6. **No despliegues.** Tampoco hagas cambios en servicios externos.

## 4. Stack y por qué

| Pieza              | Elección                                                                                           | Por qué                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | **Astro** con salida estática                                                                      | La mayoría son páginas de contenido. Astro las entrega como HTML sin JS, así que cargan rápido en el navegador interno de Instagram en celulares de gama media. |
| Interactividad     | **React** en islas (`@astrojs/react`)                                                              | Solo el configurador, el pedido, el seguimiento y el panel necesitan JS.                                                                                        |
| Estilos            | **Tailwind CSS** (`npx astro add tailwind`)                                                        | Es rápido de iterar. Los colores de la marca son variables CSS que salen de `negocio.ts`.                                                                       |
| Estado entre islas | **nanostores**, `@nanostores/react` y `@nanostores/persistent`                                     | Astro genera varias páginas y el carrito tiene que sobrevivir a la navegación. Es lo que recomienda Astro para compartir estado entre islas.                    |
| Recorte            | **react-easy-crop**                                                                                | Funciona con gestos táctiles (pellizcar para zoom) y da el área del recorte en porcentaje y en píxeles.                                                         |
| Tipos              | **TypeScript estricto** (`strict`)                                                                 | —                                                                                                                                                               |
| Pruebas            | **Vitest** para la lógica y **Playwright** para e2e, con `@axe-core/playwright` para accesibilidad | —                                                                                                                                                               |
| Calidad            | **ESLint** (`eslint-plugin-astro`, `typescript-eslint`) y **Prettier** (`prettier-plugin-astro`)   | —                                                                                                                                                               |
| Fuentes            | **Fontsource** (autoalojadas)                                                                      | Evitan las peticiones a Google Fonts y mejoran el rendimiento.                                                                                                  |

- Instala las **versiones estables actuales** y fíjalas exactas en `package.json`, sin `^` ni `~`.
- Para agregar integraciones usa `npx astro add react` y `npx astro add tailwind`, que configuran todo según la versión instalada.
- **Hosting previsto** (lo hace Erick): Netlify o Cloudflare, porque sus planes gratis permiten uso comercial. Vercel Hobby no lo permite.
- Si alguna versión cambia una API respecto a lo que dice este archivo, sigue la documentación oficial de esa versión y avísale a Erick.

## 5. Estructura del proyecto

```
src/
  config/
    negocio.ts        # ÚNICO archivo que cambia por taller (marca, medidas, precios, promociones, WhatsApp, umbrales)
  lib/                # Lógica pura, sin DOM ni React, 100% probada
    precios.ts        # Cálculo de totales y promociones
    resolucion.ts     # dpi efectivos y nivel de calidad
    whatsapp.ts       # Mensaje del pedido y URL wa.me
    pedidos.ts        # Estados, abono, saldo y transiciones
    formato.ts        # Moneda, fechas y número de pedido
    almacen.ts        # Interfaz AlmacenPedidos y su implementación en localStorage
    datos-demo.ts     # Pedidos de ejemplo para el seguimiento y el panel
  stores/
    carrito.ts        # persistentAtom con los ítems del carrito
    precios.ts        # Precios activos (negocio.ts + lo editado en el panel)
  components/
    configurador/     # Islas React del configurador
    pedido/
    seguimiento/
    taller/
    ui/               # Componentes .astro estáticos (Header, Footer, Boton…)
  layouts/
    Base.astro        # <head> con SEO y Open Graph, header, footer y aviso de demo
  pages/
    index.astro
    formatos.astro
    crear.astro
    pedido.astro
    seguimiento.astro
    taller.astro
tests/
  unit/               # Vitest (o junto a cada archivo en src/lib como *.test.ts)
  e2e/                # Playwright
  fixtures/           # Imágenes de prueba con dimensiones conocidas
scripts/
  generar-fixtures.mjs
public/
  og/                 # Imágenes Open Graph de 1200×630
```

## 6. Reglas de negocio (`src/config/negocio.ts`)

**Precios de referencia** de un taller real del mercado. Son configurables.

| id        | Medida (ancho×alto cm) | Precio  | Promoción            |
| --------- | ---------------------- | ------- | -------------------- |
| `20x27`   | 20×27                  | 30.000  | 5 o más a 15.000 c/u |
| `30x40`   | 30×40                  | 60.000  | 3 o más a 40.000 c/u |
| `45x60`   | 45×60                  | 80.000  | 2 por 130.000        |
| `60x80`   | 60×80                  | 130.000 | —                    |
| `90x120`  | 90×120                 | 250.000 | —                    |
| `120x160` | 120×160                | 330.000 | —                    |

**Marca de ejemplo:** «Áurea Estudio». El prefijo de pedido es `AE` y el eslogan es libre. Verifica el nombre según la regla 3.1.

**Forma sugerida de los tipos:**

```ts
type Promocion =
  | { tipo: 'desde'; cantidadMinima: number; precioUnitario: number } // "N o más a X c/u"
  | { tipo: 'paquete'; cantidad: number; precioPaquete: number }; // "N por X"

interface Medida {
  id: string; // '30x40'
  anchoCm: number; // en orientación vertical
  altoCm: number;
  precio: number; // COP entero
  promocion?: Promocion;
}

interface Negocio {
  marca: { nombre: string; eslogan: string; colores: Record<string, string> };
  medidas: Medida[];
  materiales: { id: 'mdf' | 'acrilico'; nombre: string; descripcion: string; recargo: number }[];
  orientaciones: ('vertical' | 'horizontal')[];
  resolucion: { buena: number; regular: number }; // dpi mínimos
  archivo: { tamanoMaxMB: number; tipos: string[] };
  whatsapp: { numero: string }; // vacío = modo demo
  pagos: { porcentajeAbono: number }; // 50
  envio: { texto: string }; // "Se cotiza por WhatsApp según tu ciudad"
}
```

**Supuestos** (márcalos con `// SUPUESTO:`):

- Las promociones aplican **por medida**, sumando la cantidad de todos los ítems de esa medida aunque tengan fotos distintas. Las medidas distintas **no** se combinan entre sí.
- Para `paquete` se calcula: `floor(n / cantidad) × precioPaquete + (n % cantidad) × precio`. Por ejemplo, 3 de 45×60 = 130.000 + 80.000 = 210.000.
- El material **no** cambia el precio (`recargo: 0` en los dos).
- Se permite la orientación horizontal: se invierten ancho y alto y el precio es el mismo.
- Los umbrales de resolución por defecto son `buena ≥ 150 dpi` y `regular ≥ 100 dpi`; por debajo es `baja`. Un taller real podría ajustarlos, porque los formatos grandes se miran de más lejos.
- El abono es `Math.ceil(total × porcentajeAbono / 100)` y el saldo es `total − abono`.

**Ojo con la proporción:** el formato se vende como 3:4, pero **20×27 no es exactamente 3:4** (0,741 frente a 0,75). El recorte usa siempre la proporción real `anchoCm / altoCm` de la medida elegida.

**Mensajes de venta que salen de las reglas:**

- Si una medida tiene promoción y al cliente le faltan pocas unidades, se muestra "Agrega 1 más de 30×40 y pagas $40.000 c/u". Se calcula en `precios.ts`.
- El desglose siempre muestra: subtotal sin promoción, descuento por medida, total, abono del 50% y saldo.

## 7. Pedidos y seguimiento

**Estados, en orden** (`pedidos.ts` valida las transiciones):

1. `recibido`: pedido recibido.
2. `abono_confirmado`: abono del 50% confirmado.
3. `en_produccion`: en producción.
4. `listo`: listo, falta pagar el saldo.
5. `saldo_pagado`: saldo pagado.
6. `enviado`: enviado, con transportadora y número de guía.
7. `entregado`: entregado.

**Datos de un pedido:** `numero` (por ejemplo `AE-1042`), `cliente { nombre, ciudad }`, `items[]`, `total`, `pagos[] { monto, fecha, nota }`, `estado`, `historial[] { estado, fecha }`, `fechaEstimada?`, `notas[] { fecha, texto }` (notas visibles para el cliente) y `envio? { transportadora, guia }`.

**Almacenamiento:**

- `almacen.ts` define la interfaz asíncrona `AlmacenPedidos` con `listar`, `obtener(numero)`, `guardar(pedido)` y `restaurarDemo()`.
- En la fase 1 se implementa con `localStorage`. En la fase 2 se cambia por Supabase sin tocar los componentes.
- `datos-demo.ts` trae 3 pedidos de ejemplo:
  - uno `en_produccion` con una nota ("Tu cuadro entra a impresión mañana");
  - uno `listo` con saldo pendiente;
  - uno `enviado` con guía.

## 8. Páginas

| Ruta           | Qué tiene                                                                                                                                                                                                                           | JS                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `/`            | Hero, "cómo funciona" en 3 pasos (sube tu foto → elige medida → recibe tu cuadro), galería con arte generado en SVG mostrado como cuadros, materiales, pagos 50/50, envíos a todo Colombia, preguntas frecuentes y botón a `/crear` | Ninguno, o una isla mínima  |
| `/formatos`    | Tabla de medidas, precios y promociones, más una **comparación visual de tamaños a escala** frente a una silueta de sofá                                                                                                            | Isla de precios (sección 9) |
| `/crear`       | **Configurador** (sección 10)                                                                                                                                                                                                       | `client:load`               |
| `/pedido`      | Carrito, desglose, "te falta N para la promoción", formulario (nombre, ciudad, celular, nota), vista previa del mensaje y botón "Pedir por WhatsApp"                                                                                | `client:load`               |
| `/seguimiento` | Busca por número de pedido y muestra la línea de estados, fecha estimada, pagos, saldo, notas y guía                                                                                                                                | `client:load`               |
| `/taller`      | **Panel demo sin login** (aviso visible): lista de pedidos, cambio de estado con un toque, registro de pagos, notas, fecha estimada, edición de precios y promociones y botón "Restaurar datos de ejemplo"                          | `client:load`               |

- El **header** muestra un contador del carrito, que es una isla pequeña con `client:idle`.
- El **footer** lleva "Demo · marca ficticia".

## 9. Trampa de Astro estático: precios editables

Las páginas se generan en el build con los valores de `negocio.ts`. Si el panel cambia un precio, el HTML estático no se entera. Por eso:

- todo lo que muestre precios (la tabla de `/formatos`, el configurador y el pedido) es una isla que lee `stores/precios.ts`;
- ese store arranca con `negocio.ts` y le aplica encima lo editado en el panel, que se guarda en `localStorage`;
- el HTML inicial muestra los valores por defecto, así que la página se ve bien aunque no cargue JS.

## 10. Configurador: detalles técnicos

**1. Subir la imagen**

- Se acepta `image/jpeg`, `image/png` y `image/webp`, con un tamaño máximo configurable de 25 MB.
- Si llega **HEIC** (iPhone) y el navegador no lo puede decodificar, muestra un mensaje claro: "Tu foto está en formato HEIC. Cámbiala a JPG (en iPhone: Ajustes › Cámara › Formatos › Más compatible) o envíala por WhatsApp". **No** agregues librerías pesadas de conversión en la fase 1.

**2. Original y vista previa**

- Guarda el `File` original y lee sus **dimensiones reales ya con la orientación EXIF aplicada**, con `createImageBitmap(file, { imageOrientation: 'from-image' })` o un equivalente.
- Para mostrarla, genera una **vista previa reducida a unos 2000 px** en el lado largo. Una foto de 48 MP a resolución completa puede agotar la memoria de un celular de gama media.

**3. Recorte**

- Usa `react-easy-crop` con `aspect = anchoCm / altoCm` de la medida y la orientación elegidas.
- Guarda el **recorte en porcentajes** (`croppedArea`), no en píxeles de la vista previa.
- Los píxeles reales del recorte son `porcentaje × dimensiones originales`.

**4. Resolución**

- Se calcula en `resolucion.ts`: `dpi = min(anchoPx / (anchoCm / 2,54), altoPx / (altoCm / 2,54))`.
- Muestra el nivel (buena, regular o baja) **para la medida elegida** y sugiere "la medida más grande con calidad buena para esta foto".
- El aviso se anuncia con `aria-live="polite"`.

**5. Opciones**

- Medida, orientación, material y cantidad, como grupos de radio accesibles con teclado.

**6. Vista previa en la pared**

- La pared y un sofá de **200 cm** se dibujan en **SVG**. Así no hace falta licenciar fotos y la escala es exacta.
- El cuadro se dibuja a escala: los px por cm salen del ancho del sofá.
- **MDF:** acabado mate, con un canto oscuro de unos 3 mm y una sombra suave.
- **Acrílico:** acabado con brillo (un degradado de reflejo encima) y una sombra un poco más marcada.

**7. Precio y botón**

- Precio en vivo con la promoción aplicada, y el botón "Agregar al pedido".
- El carrito guarda la medida, la orientación, el material, la cantidad, el recorte en porcentaje, el nombre del archivo, las dimensiones y los dpi.
- **No** guarda la imagen en `localStorage`, porque no cabe. La miniatura se reconstruye en la sesión y, si se perdió, se muestra un aviso.

**Rendimiento:** la vista previa y el recorte tienen que sentirse fluidos con una foto de 12 a 48 MP en un celular de gama media. Libera los ObjectURL con `URL.revokeObjectURL`.

## 11. WhatsApp

- **URL:** `https://wa.me/<numero>?text=<encodeURIComponent(mensaje)>`. El número va en formato internacional sin `+` (`57XXXXXXXXXX`).
- **Modo demo:** si `negocio.whatsapp.numero` está vacío, **no se abre ningún chat**. Solo se muestra la vista previa del mensaje, con el aviso "En la versión real esto abre el WhatsApp del taller".
- **El mensaje lleva:**
  - el número de pedido;
  - cada ítem (medida, orientación, material, cantidad, nombre del archivo y calidad);
  - el desglose con promociones, el total, el abono del 50% y el saldo;
  - el nombre y la ciudad del cliente;
  - la línea de envío;
  - y, en la fase 1, la línea **"Adjunto mis fotos en este chat"**, porque las imágenes no salen del navegador.
- Mantén el texto por debajo de unos **1.800 caracteres**. Si se pasa, compacta los ítems. Las pruebas lo verifican.

## 12. Diseño visual

- **Estética:** fondo oscuro, acentos dorados, títulos en serif (por ejemplo Cormorant Garamond o Playfair Display) y cuerpo en sans (por ejemplo Inter), todo con Fontsource. Los colores salen de `negocio.marca.colores` como variables CSS.
- **Contraste AA** en todos los textos. El dorado sobre negro se usa para títulos y acentos, no para párrafos largos en gris.
- **Mobile-first:** a 375 px no hay scroll horizontal, los objetivos táctiles miden al menos 44 px y el recorte funciona con los dedos.
- **SEO y Open Graph:** cada página tiene `title`, `description`, `og:title`, `og:description`, `og:image` (1200×630, en `public/og/`) y `og:locale = es_CO`. Esto importa porque el link se comparte por WhatsApp e Instagram.

## 13. Hitos

Cada hito se cierra con `npm run check`, `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build` en verde. Después:

1. un commit (o varios pequeños) con un mensaje claro en español, por ejemplo `feat: configurador con recorte y aviso de resolución`;
2. el push a `main`;
3. un resumen corto a Erick: qué se hizo, qué puede probar con `npm run dev` y qué decisiones tomaste.

**H0: base del proyecto**

- Astro con TS estricto, React, Tailwind, nanostores, Vitest, Playwright, ESLint y Prettier.
- `.gitattributes` con `* text=auto eol=lf`. Erick usa Windows y así se evitan problemas de saltos de línea.
- `.gitignore`: `node_modules`, `dist`, `.astro`, `playwright-report`, `test-results`, `.env*`.
- Scripts multiplataforma, sin `rm -rf` ni comandos que solo existan en bash.
- `negocio.ts` con los tipos y los datos de la sección 6.
- `Base.astro` con header y footer, y `/` provisional.
- Una prueba e2e de humo y el primer push.

**H1: lógica pura**

- `precios.ts`, `resolucion.ts`, `whatsapp.ts`, `pedidos.ts`, `formato.ts`, `almacen.ts` y `datos-demo.ts`, con pruebas en tabla (sección 14).
- Cubre todas las ramas de `precios.ts`.

**H2: páginas de contenido**

- `/` y `/formatos` completas, con la tabla como isla y la comparación de tamaños a escala.

**H3: configurador**

- `/crear` completo, según la sección 10.
- e2e: subir la imagen, recortar, elegir medida, ver el aviso y agregar al pedido.

**H4: pedido**

- Carrito persistente, contador en el header, `/pedido` con desglose, "te falta N", formulario, vista previa del mensaje y modo demo.
- e2e del flujo completo.

**H5: seguimiento y panel**

- `/seguimiento` y `/taller`.
- e2e: cambiar el estado y agregar una nota en el panel, y ver el cambio en el seguimiento.

**H6: pulido**

- Revisión a 375 px y en escritorio, axe sin violaciones serias y Lighthouse móvil.
  - Meta: rendimiento ≥ 90 en `/` y `/formatos`.
- Open Graph.
- `README.md` con:
  - qué es;
  - cómo correrlo;
  - **cómo adaptarlo a otro taller** editando `negocio.ts`;
  - los supuestos;
  - cómo desplegarlo: build command `npm run build`, carpeta `dist` y la versión de Node.

## 14. Pruebas y verificación

**Unitarias (Vitest)**

- **Precios:**
  - 20×27: con 4 unidades = 120.000; con 5 = 75.000.
  - 30×40: con 2 = 120.000; con 3 = 120.000 (promoción a 40.000 c/u).
  - 45×60: con 1 = 80.000; con 2 = 130.000; con 3 = 210.000.
  - Mezcla: 2 de 20×27 con fotos distintas más 3 de 20×27 = 5 unidades → promoción.
  - Las medidas distintas no se combinan.
  - Cantidad 0 o negativa → error.
  - "Te falta N": 2 de 30×40 → "agrega 1".
- **Resolución:** foto vertical de 12 MP (3024×4032), recorte completo en cada medida:

  | Medida  | dpi aprox. | Nivel   |
  | ------- | ---------- | ------- |
  | 20×27   | 379        | buena   |
  | 30×40   | 256        | buena   |
  | 45×60   | 171        | buena   |
  | 60×80   | 128        | regular |
  | 90×120  | 85         | baja    |
  | 120×160 | 64         | baja    |

  Además: la orientación horizontal invierte ancho y alto, y la sugerencia de "medida más grande con calidad buena" para esa foto es 45×60.

- **WhatsApp:** el encoding de tildes, ñ, saltos de línea y `&`; el límite de caracteres; el modo demo con el número vacío.
- **Pedidos:** las transiciones válidas e inválidas, el abono redondeado hacia arriba y el saldo.

**E2E (Playwright)**

- Dos proyectos: uno móvil (viewport de unos 390×844) y uno de escritorio.
- Las imágenes de prueba se generan con `scripts/generar-fixtures.mjs`, usando `sharp` como devDependency: `retrato-12mp.jpg` (3024×4032) y `pequena.jpg` (800×600). Las dos son de color plano o degradado para que pesen poco.
- Flujos:
  1. configurador completo hasta el carrito;
  2. pedido con la vista previa del mensaje;
  3. seguimiento del pedido demo `AE-1041`;
  4. cambio de estado en el panel visible en el seguimiento;
  5. aviso de calidad "baja" con `pequena.jpg` en 60×80.
- Accesibilidad: `@axe-core/playwright` en cada página.

## 15. Git y repositorio

- **Remoto:** `https://github.com/eri323/arte-web.git` (público). Rama: `main`.
- Si la carpeta ya tiene `.git` con `origin` (Erick pudo haber hecho `git clone`), **no** la reinicialices. Si no, usa `git init -b main` y `git remote add origin …`.
- **Cuenta:** el push tiene que salir con la cuenta **eri323**. En esta máquina, la cuenta activa de `gh` puede ser otra (la del trabajo).
  - Antes del primer push, revisa `git config user.name`, `git config user.email` y `gh auth status`.
  - Si la identidad no es la de eri323, **detente y pregúntale a Erick**. No adivines el correo.
- **El repo es público:** no subas datos personales, secretos ni información de clientes reales.

## 16. Fase 2 (NO hacer ahora; solo cuando haya un taller que pague)

- **Supabase:**
  - tablas `pedidos`, `items`, `pagos` y `config`;
  - **Storage** para las imágenes originales, subidas con URL firmada (el link va en el mensaje de WhatsApp);
  - **Auth** para `/taller`;
  - **RLS**.
- **Endpoints de Astro** con el adapter de Netlify o Cloudflare:
  - **recalcular el precio en el servidor**: nunca se confía en el total que manda el cliente;
  - **webhook de pagos** para el link del 50% con Wompi o Bold.
- El seguimiento pide el **número de pedido más los últimos 4 dígitos del celular**, para no exponer datos.
- Las imágenes se borran cuando el pedido se entrega.
- **Modo "tu foto como portada de álbum":** una plantilla que convierte la foto del cliente en un póster estilo álbum, con la paleta extraída de la imagen. Erick tiene un prototipo local (`album-poster-generator`, React + Vite) del que se puede reutilizar la extracción de paleta y el render. Nunca se traen carátulas por API.

## 17. Comandos (los defines en H0)

| Comando            | Qué hace                                             |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Servidor local                                       |
| `npm run build`    | Build estático en `dist/`                            |
| `npm run preview`  | Sirve el build                                       |
| `npm run check`    | `astro check` (tipos)                                |
| `npm run lint`     | ESLint                                               |
| `npm run format`   | Prettier                                             |
| `npm test`         | Vitest                                               |
| `npm run test:e2e` | Playwright (genera los fixtures antes si no existen) |

## 18. Decisiones tomadas (31-oct-2026)

Completan huecos de las secciones anteriores. Mandan sobre ellas si hay duda.

- **El pedido del cliente se guarda.** Al tocar «Pedir por WhatsApp» en `/pedido`, se llama a `almacen.guardar(pedido)` con estado `recibido` y el siguiente número libre (`AE-1043`, `AE-1044`…). Ese número va en el mensaje de WhatsApp, y al cliente se le muestra junto a un link a `/seguimiento?numero=<numero>`. Así el pedido aparece en `/taller` y en `/seguimiento`.
  - Límite: como vive en `localStorage`, solo se ve **en el mismo navegador**. Se avisa en la página y en el README.
  - «Restaurar datos de ejemplo» borra también los pedidos creados por el cliente.
  - Esto también funciona en modo demo (número de WhatsApp vacío): se guarda el pedido aunque no se abra ningún chat.
- **Pedidos demo:** `AE-1040` (`en_produccion`, con la nota), `AE-1041` (`listo`, con saldo pendiente) y `AE-1042` (`enviado`, con guía). Sus fechas se calculan **relativas al momento de `restaurarDemo()`**, no fijas, para que la demo no se vea vieja.
- **«Te falta N» con paquete:** «Agrega 1 más de 45×60 y llevas 2 por $130.000». Con `desde` se mantiene «Agrega 1 más de 30×40 y pagas $40.000 c/u».
- **Lighthouse** se corre con `npx` en H6. No se agrega a `package.json`.
- **Rama:** en este repo personal se hace commit y push directo a `main`, como dice la sección 13, aunque el entorno de trabajo de Erick sugiera ramas.

## 19. Registro de avance (actualízalo al cerrar cada hito)

- [x] H0: base del proyecto
- [x] H1: lógica pura
- [x] H2: páginas de contenido
- [x] H3: configurador
- [x] H4: pedido
- [ ] H5: seguimiento y panel
- [ ] H6: pulido
