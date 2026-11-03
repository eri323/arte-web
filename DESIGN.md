---
name: Midas Atelier (propuesta web sobre arte-web)
description: Tienda de arte con los cuadros de protagonistas. Fondo neutro, tinta como color principal, el oro y el rojo LED de Midas como acentos.
colors:
  fondo: '#f2f2f0'
  superficie: '#e7e7e3'
  tinta: '#0b0a09'
  tinta-suave: '#5c5b57'
  oro: '#b07d1f'
  oro-texto: '#7d5d1b'
  noche: '#0b0a09'
  oro-noche: '#e3b54a'
  hueso: '#f3ece0'
  led: '#ff2d20'
typography:
  display:
    fontFamily: 'Inter Tight Variable, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(2.375rem, 4.6vw, 4rem)'
    fontWeight: 600
    letterSpacing: '-0.035em'
    lineHeight: 1.02
  headline:
    fontFamily: 'Inter Tight Variable, sans-serif'
    fontSize: 'clamp(1.875rem, 3.4vw, 2.75rem)'
    fontWeight: 600
    letterSpacing: '-0.028em'
  body:
    fontFamily: 'Inter Tight Variable, sans-serif'
    fontSize: '1rem'
    lineHeight: 1.6
  cartela:
    fontFamily: 'Newsreader Variable, Georgia, serif'
    fontStyle: italic
rounded:
  boton: '10px'
  cuadro-portada: '14px'
  tarjeta: '12px'
  bloque: '24px'
components:
  button-primary:
    backgroundColor: '{colors.tinta}'
    textColor: '{colors.fondo}'
    rounded: '{rounded.boton}'
    height: '48px'
  button-secondary:
    backgroundColor: 'tinta al 7% sobre el fondo'
    textColor: '{colors.tinta}'
  button-pedir:
    backgroundColor: '{colors.oro-noche}'
    textColor: '{colors.noche}'
---

# Design System: Midas Atelier

Rediseño del 3-nov-2026 (tercera versión). Referencia visual: el pin de Pinterest
`893331276096299450`, una sola pantalla de portada («Pallet Ross»). Las secciones de abajo no
tienen referencia: llevan el mismo lenguaje.

## 1. Overview

**Creative North Star: "Los cuadros hablan primero"**

Una tienda de arte, no una landing. La portada tiene un titular moderado, el abanico de cuadros
montado justo debajo y, después, una frase corta con dos botones. Todo respira sobre un gris neutro.

Lo que se tomó de la referencia:

| Referencia                                         | En Midas                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| Fondo gris casi blanco, sin texturas               | `fondo` `#f2f2f0`                                                   |
| Menú mínimo con enlaces en texto chico             | Header de 13 px y el pedido como botón gris                         |
| Titular grotesco, apretado, centrado en 2 líneas   | Inter Tight 600, `-0.035em`, «Tu espacio, / a tu estilo.»           |
| Abanico de obras superpuestas, giradas, con sombra | Nueve diseños 3:4 (el formato real del producto), esquinas de 14 px |
| Burbujas de @usuario sobre las obras               | Burbujas de chat en oro y rojo LED: el pedido se habla por WhatsApp |
| Texto y botones debajo del abanico                 | Bajada de 15 px, botón negro y botón gris                           |

Lo que se adaptó a propósito:

- Botones con esquinas de 10 px, no píldoras (la referencia sí las usa). Las únicas píldoras son las burbujas de chat.
- Cartelas en Newsreader cursiva (títulos de obra, antetítulos, números de los pasos), como los rótulos de una galería.
- Bloques negros redondeados dentro de la página (pared y cierre), que recuerdan la pantalla enmarcada de la referencia.

## 2. Colors

Los del sitio salen de `negocio.marca.colores` (variables `--marca-*`), así el panel los puede cambiar.

| Token          | Valor     | Uso                                                           |
| -------------- | --------- | ------------------------------------------------------------- |
| `fondo`        | `#f2f2f0` | Gris neutro: deja que manden los cuadros.                     |
| `superficie`   | `#e7e7e3` | Fondo de las fotos.                                           |
| `texto`        | `#0b0a09` | Tinta, el color principal: texto y botón principal (17,6:1).  |
| `textoSuave`   | `#5c5b57` | Texto secundario y segunda parte de los títulos (6:1).        |
| `acento`       | `#b07d1f` | Oro del logo y de los botones de pedir sobre claro (3,2:1).   |
| `acentoFuerte` | `#7d5d1b` | Oro para texto pequeño: números de los modos y pasos (5,4:1). |
| `led` (fijo)   | `#ff2d20` | Luz del cuarto y burbuja de chat (texto negro, 5,3:1).        |

**Bloques de noche** (`.noche` en `global.css`): la pared, el cierre, la tarjeta «¿No ves lo que
buscas?» y el footer. Fondo `#0b0a09`, texto hueso `#f3ece0`, oro `#e3b54a`.

**La regla del oro.** El dorado se reserva para pedir y para la marca. No todos los colores de Midas
en cada sección: el rojo LED solo vive en la pared y en una burbuja.

## 3. Typography

- **Display** (`texto-cartel`): titular de portada, moderado para no competir con los cuadros.
- **Headline** (`titulo-seccion`): títulos en dos tonos (tinta y `texto-suave`).
- **Antetítulo** (`antetitulo`): cartela en Newsreader cursiva de 17 px, sin mayúsculas.
- **Cartela** (`font-editorial`): nombres de los diseños y números.
- **Body** (Inter Tight 400, 16 px, interlineado 1,6).
- Big Shoulders (`--font-cartel`) queda solo dentro del arte generado de los diseños.

## 4. Elevation

- **Cuadro** (`sombra-cuadro`): sombra suave en tres capas, sin canto duro.
- **Tarjeta del catálogo**: sombra que crece y la tarjeta sube 4 px al pasar el cursor.
- **Acrílico** (`sombra-acrilico`): borde claro de 1 px y reflejo diagonal.
- Sin degradados decorativos. El único resplandor es la luz del LED en la pared.

## 5. Components

- **Botones**: `boton-negro` (principal), `boton-linea` (gris, secundario), `boton-oro` (pedir). Se hunden a `scale(0.97)` al tocarlos.
- **Abanico**: baja hacia la izquierda y sube hacia la derecha, como visto de lado. En el celular se ocultan las cartas de las puntas y la burbuja derecha.
- **Inspiración** (`Vitrina.tsx`): sigue la segunda sección del video del pin. Texto a la izquierda (antetítulo en versalitas, titular en tres líneas con la del medio en oro, que entra palabra por palabra) y, a la derecha, los diseños en escalera que se abren desde un mazo y se salen por el borde. El del frente se describe abajo (nombre, categoría, colores), se cuelga con «Ver en mi pared» y las flechas lo cambian. Globos con el `#estilo` en el primero y el tercero. Filtros debajo de los botones.
- **Pared**: bloque negro de 24 px de radio. Desde 1280 px, escena 3:2 con el panel encima a la derecha.
- **Personalizado**, **proceso**, **resultados**: huecos punteados de 14 px de radio con el nombre del material que va ahí.

## 6. Motion

- Curvas: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` y `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)`.
- Portada en cascada (70 ms entre piezas), abanico que abre y burbujas que llegan después y flotan 4 px.
- Secciones que aparecen una vez al entrar en pantalla (`.aparece` + IntersectionObserver en `Base.astro`).
- Cambio de color o de diseño con un desenfoque corto; «Agregado ✓» en el botón y saltito del contador.
- Hovers solo con mouse (`hover: hover`). Con movimiento reducido: sin desplazamientos, solo fundidos.

## 7. Do's and Don'ts

- **Do** reemplazar los huecos por fotos y videos reales del taller, y el arte por fotos (`negocio.catalogo[].foto`).
- **Do** mantener el titular moderado: si crece, pierde el abanico.
- **Don't** redondear todo: las líneas de 1 px siguen ordenando listas, modos y preguntas.
- **Don't** píldoras en botones, degradados de fondo, vidrio esmerilado fuera del header ni grano.
- **Don't** rayas largas (—) en los textos.
