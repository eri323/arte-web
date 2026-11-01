# arte-web

Plataforma demo para talleres que imprimen **cuadros personalizados en MDF o acrílico** a partir de la foto del cliente. Usa una marca ficticia, **Áurea Estudio**.

> Demo · marca ficticia. No representa a ningún negocio real.

## Qué resuelve

Los talleres venden por Instagram y cierran por WhatsApp. Eso deja dos cuellos de botella:

- **Antes de la venta:** el cliente pregunta una y otra vez por medidas, precios, promociones y si su foto sirve.
- **Después de la venta:** el pago va en dos partes (50 % de abono y 50 % antes del envío), y el cliente no sabe en qué va su cuadro.

La plataforma ofrece:

| Página         | Para qué                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/`            | Presentación, cómo funciona, galería, pagos y preguntas frecuentes                                               |
| `/formatos`    | Medidas, precios, promociones y comparación de tamaños a escala                                                  |
| `/crear`       | Configurador: subir la foto, recortarla, elegir medida y material, verla en una pared, aviso de calidad y precio |
| `/pedido`      | Carrito, desglose con promociones y mensaje listo para WhatsApp                                                  |
| `/seguimiento` | Estado del pedido, abono, saldo, notas del taller y guía de envío                                                |
| `/taller`      | Panel demo para cambiar estados, registrar pagos y editar precios                                                |

Todo corre en el navegador. **La foto del cliente nunca sale de su equipo.**

## Estado

| Hito                                                      | Estado |
| --------------------------------------------------------- | ------ |
| H0 · Base del proyecto                                    | ✅     |
| H1 · Lógica pura (precios, resolución, WhatsApp, pedidos) | ✅     |
| H2 · Páginas de contenido                                 | ✅     |
| H3 · Configurador                                         | ✅     |
| H4 · Pedido                                               | ✅     |
| H5 · Seguimiento y panel                                  | ✅     |
| H6 · Pulido                                               | ✅     |

Lighthouse móvil (build local): `/` 99 y `/formatos` 97 en rendimiento, y 100 en accesibilidad y SEO (rediseño del 31-oct-2026).

## Probar la demo

1. En `/crear`, sube una foto, elige 30×40 y cantidad 2: verás «Agrega 1 más de 30×40 y pagas $ 40.000 c/u».
2. Agrega al pedido y en `/pedido` llena tus datos. Con `whatsapp.numero` vacío (modo demo) no se abre ningún chat: verás el mensaje que le llegaría al taller y tu número de pedido (`AE-1043`, `AE-1044`…).
3. En `/seguimiento` busca ese número, o los de ejemplo `AE-1040`, `AE-1041` y `AE-1042`.
4. En `/taller` cambia el estado, registra pagos o deja una nota, y vuelve al seguimiento para verlo. «Restaurar datos de ejemplo» deja todo como al principio.

Los pedidos y los precios editados viven en el `localStorage` de tu navegador: otra persona, u otro navegador, no los ve.

## Stack

Astro (salida estática) · React en islas · Tailwind CSS v4 · nanostores · TypeScript estricto · Vitest · Playwright con axe · ESLint y Prettier · Fontsource.

## Cómo correrlo

Requisitos: **Node 22.23.4 o superior** y npm.

```bash
npm install
npm run dev
```

Abre `http://localhost:4321`.

### Comandos

| Comando            | Qué hace                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Servidor local                                                                                                          |
| `npm run build`    | Build estático en `dist/`                                                                                               |
| `npm run preview`  | Sirve el build                                                                                                          |
| `npm run check`    | Revisión de tipos (`astro check`)                                                                                       |
| `npm run lint`     | ESLint                                                                                                                  |
| `npm run format`   | Prettier                                                                                                                |
| `npm test`         | Pruebas unitarias (Vitest)                                                                                              |
| `npm run test:e2e` | Pruebas e2e (Playwright). Instala Chromium y genera las imágenes de prueba si faltan (la primera vez descarga Chromium) |
| `npm run og`       | Regenera las imágenes Open Graph de `public/og/` (cámbialas si cambias la marca)                                        |
| `npm run fixtures` | Solo genera las imágenes de prueba en `tests/fixtures/`                                                                 |

La e2e levanta su propio servidor en el puerto **4322**, así que puede correr con `npm run dev` abierto.

## Cómo adaptarlo a otro taller

Todo lo que cambia de un taller a otro está en **un solo archivo**: [`src/config/negocio.ts`](src/config/negocio.ts).

| Campo                   | Qué cambiar                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marca`                 | Nombre, eslogan, prefijo de pedido (`AE` → `AE-1042`) y colores. Los colores se vuelven variables CSS y clases de Tailwind (`bg-fondo`, `bg-acento`, `text-acento-fuerte`…) |
| `vitrina`               | Frase y bajada de la portada, y fotos propias del taller (`fotoPortada`, `galeria`) en `public/`. Sin fotos se muestra arte generado                                        |
| `medidas`               | Medidas en cm (en vertical), precio en pesos enteros y promoción opcional                                                                                                   |
| `materiales`            | Nombre, descripción y recargo de cada material                                                                                                                              |
| `resolucion`            | dpi mínimos para calidad «buena» y «regular»                                                                                                                                |
| `archivo`               | Tamaño máximo y formatos de imagen aceptados                                                                                                                                |
| `whatsapp.numero`       | Número en formato internacional sin `+` (`57XXXXXXXXXX`). Vacío = modo demo, no abre ningún chat                                                                            |
| `pagos.porcentajeAbono` | Porcentaje del abono inicial                                                                                                                                                |
| `envio.texto`           | Texto sobre el envío                                                                                                                                                        |

Promociones disponibles:

```ts
{ tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 } // "3 o más a $40.000 c/u"
{ tipo: 'paquete', cantidad: 2, precioPaquete: 130000 }     // "2 por $130.000"
```

Si cambias el nombre o los colores, actualiza también la constante `marca` de `scripts/generar-og.mjs` y corre `npm run og` para regenerar las imágenes que se ven al compartir el link.

Si cambias los colores, corre `npm run test:e2e`: axe avisa si algún texto queda sin contraste suficiente.

En la demo los colores también se pueden probar sin tocar código: `/taller` → «Colores de la marca» (paletas de ejemplo o colores propios, con revisión de contraste). Se guardan en el navegador; para dejarlos fijos, cópialos a `negocio.marca.colores`.

El sistema visual (paleta, tipografía, componentes y reglas) está en [`DESIGN.md`](DESIGN.md), y la marca y su público en [`PRODUCT.md`](PRODUCT.md). Sirve también como base para otro tipo de tienda (por ejemplo ropa): se cambian textos, fotos y colores en `negocio.ts`.

## Supuestos

Están marcados en el código con `// SUPUESTO:`. Los principales:

- Las promociones aplican **por medida**, sumando todos los ítems de esa medida aunque tengan fotos distintas. Las medidas distintas no se combinan.
- Paquete: `floor(n / cantidad) × precioPaquete + (n % cantidad) × precio`. Por ejemplo, 3 de 45×60 cuestan $210.000.
- El material no cambia el precio.
- La orientación horizontal invierte ancho y alto y cuesta lo mismo.
- Calidad de la foto: buena desde 150 dpi, regular desde 100 dpi; por debajo, baja.
- Abono = `Math.ceil(total × 50 / 100)`; saldo = total − abono.
- El envío no tiene precio: se cotiza por WhatsApp según la ciudad.
- Los pedidos se guardan en `localStorage`, así que solo se ven **en el mismo navegador** donde se hicieron.
- El pedido solo avanza al estado siguiente. Confirmar el abono exige el 50 % pagado, marcar el saldo exige el total pagado y enviar exige transportadora y guía. En el panel, un toque registra el pago que falta y avanza.
- «Agrega N más…» se muestra siempre que falte al menos una unidad para la promoción.
- Los pedidos del cliente se numeran desde `AE-1043`, después de los tres de ejemplo.
- Se puede agregar un cuadro con calidad baja: el aviso se muestra y la calidad viaja en el mensaje para que el taller decida.
- El dominio en `astro.config.mjs` (`site`) es provisional.

## Despliegue

Es un sitio estático, sin backend ni variables de entorno.

| Ajuste            | Valor                               |
| ----------------- | ----------------------------------- |
| Build command     | `npm run build`                     |
| Carpeta de salida | `dist`                              |
| Versión de Node   | 22.23.4 o superior (probado con 24) |

Antes de desplegar, cambia `site` en `astro.config.mjs` por el dominio real, para que las vistas previas de los links en WhatsApp e Instagram apunten bien.

Hosting sugerido: **Netlify** o **Cloudflare Pages**, porque sus planes gratis permiten uso comercial (Vercel Hobby no).

## Fase 2 (no incluida)

Para un taller real: base de datos y almacenamiento de fotos con Supabase, login para el panel, precio recalculado en el servidor y link de pago del abono. El detalle está en la sección 16 de [`CLAUDE.md`](CLAUDE.md).
