---
name: Midas Atelier (propuesta web sobre arte-web)
description: Galería contemporánea + tienda de interiores. Tinta y papel; el oro del logo para pedir; el rojo LED solo en la pared.
colors:
  papel: '#f4f1eb'
  papel-sombra: '#eae5dc'
  tinta: '#0b0a09'
  tinta-suave: '#6b645c'
  oro: '#b07d1f'
  oro-texto: '#7d5d1b'
  noche: '#0b0a09'
  oro-noche: '#e3b54a'
  hueso: '#f3ece0'
  led: '#ff2d20'
typography:
  display:
    fontFamily: 'Newsreader Variable, Georgia, serif'
    fontSize: 'clamp(2.125rem, 3.8vw, 3.25rem)'
    fontWeight: 500
    lineHeight: 1.08
  headline:
    fontFamily: 'Newsreader Variable, Georgia, serif'
    fontSize: 'clamp(2rem, 3.6vw, 3rem)'
    fontWeight: 500
    lineHeight: 1.08
  body:
    fontFamily: 'Libre Franklin Variable, Helvetica Neue, Arial, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.65
  antetitulo:
    fontFamily: 'Libre Franklin Variable, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    letterSpacing: '0.18em'
    textTransform: uppercase
rounded:
  boton: '2px'
  panel: '0'
components:
  button-primary:
    backgroundColor: '{colors.tinta}'
    textColor: '{colors.papel}'
    rounded: '{rounded.boton}'
    height: '48px'
  button-pedir:
    backgroundColor: '{colors.oro-noche}'
    textColor: '{colors.noche}'
  button-secondary:
    backgroundColor: 'transparent'
    border: '1px currentColor'
---

# Design System: Midas Atelier

Rediseño del 3-nov-2026 (segunda versión), a partir de `midas-atelier-propuesta.html`. Reemplaza la
versión de cartel condensado (Big Shoulders + Manrope, botones en pastilla).

## 1. Overview

**Creative North Star: "Una galería que también te cuelga el cuadro"**

Galería contemporánea con algo de tienda de interiores. La tinta ordena (bloques, botones, texto), el
oro del logo se reserva para pedir y el rojo LED es solo ambiente de la pared.

- Tema claro de papel; bandas de noche en la pared, el proceso, el cierre y el footer (`.noche`).
- Serif editorial de contraste medio para titulares (voz de galería); sans clásica para leer y navegar.
- Esquinas rectas (2 px en botones). Líneas de 1 px para ordenar en vez de tarjetas.
- Sombras solo donde hay un objeto físico: los cuadros.
- Títulos en dos tonos: la primera parte en tinta y la segunda en `texto-suave` («Tu espacio, _a tu estilo_»).
- Portada centrada: titular, dos botones y el abanico de nueve cuadros debajo.
- Movimiento con ease-out suave (`--ease-suave`). El único «rebote» es el columpio del cuadro en su clavo.

## 2. Colors

Los del sitio salen de `negocio.marca.colores` (variables `--marca-*`), así el panel los puede cambiar.

| Token          | Valor     | Uso                                                                                       |
| -------------- | --------- | ----------------------------------------------------------------------------------------- |
| `fondo`        | `#f4f1eb` | Papel: fondo general.                                                                     |
| `superficie`   | `#eae5dc` | Fondo de las fotos y paneles.                                                             |
| `texto`        | `#0b0a09` | Tinta: texto, botón principal (18:1 sobre el papel).                                      |
| `textoSuave`   | `#6b645c` | Texto secundario y la segunda parte de los títulos (5,2:1).                               |
| `acento`       | `#b07d1f` | Oro del logo sobre el papel (3,2:1). Botones de pedir en el configurador y el pedido.     |
| `acentoFuerte` | `#7d5d1b` | Oro para texto pequeño: números de los modos (5,4:1). El `#8e6c1e` del HTML no pasaba AA. |
| `sobreAcento`  | `#0b0a09` | Texto sobre el oro.                                                                       |
| `acentoHover`  | `#c39a4c` | Hover del botón dorado.                                                                   |
| `led` (fijo)   | `#ff2d20` | Luz del cuarto. Token de Tailwind, no editable.                                           |

**Las bandas de noche** (clase `.noche` en `global.css`) redefinen `--marca-*` y `--color-*`: fondo
`#0b0a09`, texto hueso `#f3ece0`, texto suave `#9f978c` (6,9:1) y oro `#e3b54a`. No cambian con el
editor de colores.

**La regla del oro.** El dorado se reserva para pedir: «Agregar al pedido», «Crear desde cero» en la
tarjeta oscura del catálogo y el botón del cierre. Las demás acciones van en tinta o con contorno.

**La regla del LED.** El rojo nunca lleva texto. Es la tira encendida y su luz.

## 3. Typography

- **Display** (`texto-cartel`, Newsreader 500): titular de portada.
- **Headline** (`titulo-seccion`, clamp(2rem, 3.6vw, 3rem)): títulos de sección, con antetítulo encima.
- **Antetítulo** (`antetitulo`): versalitas espaciadas con una raya de 28 px delante.
- **Body** (Libre Franklin 400, 16 px, interlineado 1,65): párrafos de 44–54ch en `texto-suave`.
- **Lápiz** (`lapiz`): medidas y datos pequeños, con cifras tabulares.
- Big Shoulders (`--font-cartel`) queda solo dentro del arte generado de los diseños.

## 4. Elevation

- **Cuadro** (`sombra-cuadro`): canto duro de 3 px y sombra suave hacia abajo.
- **Acrílico** (`sombra-acrilico`): borde claro de 1 px, sombra más marcada y un reflejo diagonal.
- Interfaz plana: header con fondo de papel al 92% y desenfoque; botones sin sombra.

## 5. Components

- **Botón principal** (`boton boton-negro`): rectángulo de tinta de 48 px; la flecha se corre 4 px al pasar el cursor.
- **Botón de pedir** (`boton boton-oro`) y **secundario** (`boton boton-linea`, contorno que se rellena).
- **Enlace** (`enlace-fuerte`): raya de 1 px que se recoge al pasar el cursor.
- **Abanico de la portada**: nueve diseños; en el celular se ocultan los cuatro de las puntas.
- **Inspiración** (`Vitrina.tsx`): tres modos (tal cual, adaptado, desde cero), filtros como pestañas con raya, tarjetas 3:4 con círculos para ver la misma idea en cuatro colores (`VARIANTES` en `ArteCatalogo.tsx`) y dos tarjetas de invitación en la grilla.
- **Pared** (`Vitrina.tsx`): cuarto, sala o estudio a escala real (1 cm = `100cqw / ancho`). Desde 1280 px el panel va encima de la escena, a la derecha; por debajo, debajo de ella. Opciones en segmentos unidos (`GrupoOpciones variante="seg"`).
- **Personalizado** (`SubirImagen.tsx`): zona punteada para soltar una imagen; se cuelga en la pared (no sale del navegador) y el panel lleva a `/crear` para recortar y revisar calidad.
- **Proceso y resultados**: huecos punteados con el nombre del video o la foto que va ahí. Esperan el material del taller.

## 6. Do's and Don'ts

- **Do** reemplazar los huecos por los videos y fotos reales de las historias destacadas, y el arte del catálogo por fotos (`negocio.catalogo[].foto`).
- **Do** dejar los cuartos ilustrados de noche: el LED solo se luce a oscuras.
- **Do** respetar `prefers-reduced-motion`: sin abanico animado, sin fundidos ni columpio.
- **Don't** usar el oro en títulos ni en acciones que no sean pedir.
- **Don't** tarjetas con borde redondeado y sombra para ordenar contenido: líneas de 1 px.
- **Don't** texto con degradado, grano ni vidrio esmerilado fuera del header.
- **Don't** rayas largas (—) en los textos.
