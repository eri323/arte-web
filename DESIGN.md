---
name: Midas Atelier (propuesta web sobre arte-web)
description: Cuarto oscuro iluminado por LED rojo. El dorado del logo solo en lo que importa.
colors:
  papel: '#f5f1ea'
  papel-sombra: '#e8e4dd'
  tinta: '#1a1612'
  tinta-suave: '#67635e'
  oro: '#b07d1f'
  oro-texto: '#835e1b'
  oro-hover: '#bc9244'
  noche: '#0b0a09'
  oro-noche: '#e7b94c'
  led: '#ff2d20'
typography:
  display:
    fontFamily: 'Big Shoulders Display Variable, Impact, Arial Narrow, sans-serif'
    fontSize: 'clamp(3.6rem, 11vw, 10.5rem)'
    fontWeight: 900
    lineHeight: 0.9
    textTransform: uppercase
  headline:
    fontFamily: 'Big Shoulders Display Variable, Impact, sans-serif'
    fontSize: 'clamp(2.75rem, 7vw, 5.75rem)'
    fontWeight: 900
    lineHeight: 0.9
    textTransform: uppercase
  body:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.55
  antetitulo:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 800
    letterSpacing: '0.22em'
    textTransform: uppercase
rounded:
  boton: '999px'
  panel: '16–20px'
components:
  button-primary:
    backgroundColor: '{colors.oro}'
    textColor: '{colors.negro}'
    rounded: '{rounded.boton}'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.oro-claro}'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.hueso}'
    border: 'inset 1.5px {colors.linea-fuerte}'
---

# Design System: Midas Atelier

Rediseño del 3-nov-2026, a partir de la propuesta `midas-atelier-propuesta.html`. Reemplaza el sistema
«estudio de afiches de barrio» de Áurea Estudio.

## 1. Overview

**Creative North Star: "Papel claro de día, el cuarto con LED de noche"**

El sitio es claro: papel cálido y tinta, con el oro del logo. La noche aparece donde el producto se
luce: la pared donde se cuelga el cuadro (`#pared`) es una banda oscura con LED, y los montajes y la
foto del celular muestran cuartos oscuros. La tira LED de la portada y del cierre es una línea
encendida, no una mancha de color.

- Tema claro (`color-scheme: light`), sin grano ni texturas decorativas.
- El oro solo en el logo, los precios, el botón principal y la barra del abono. Los títulos van en tinta.
- Excepción a propósito: la pared conserva su versión de noche (línea «Ver en tu pared» y «Míralo **antes** de pedir» con la palabra en oro). Fue elección de Erick.
- Portada asimétrica: titular a la izquierda, cuadros colgados sobre la tira a la derecha.
- Movimiento con ease-out expo. El único «rebote» es el columpio del cuadro en su clavo.

## 2. Colors

Los del sitio salen de `negocio.marca.colores` (variables `--marca-*`), así el panel los puede cambiar.

| Token          | Valor     | Uso                                                  |
| -------------- | --------- | ---------------------------------------------------- |
| `fondo`        | `#f5f1ea` | Papel: fondo general.                                |
| `superficie`   | `#e8e4dd` | Bandas alternas y paneles.                           |
| `texto`        | `#1a1612` | Tinta (16:1 sobre fondo).                            |
| `textoSuave`   | `#67635e` | Texto secundario (≥ 4,5:1 sobre fondo y superficie). |
| `acento`       | `#b07d1f` | Oro: botón, barra del abono (3,2:1 contra el papel). |
| `acentoFuerte` | `#835e1b` | Oro para texto pequeño: precios, enlaces (5,6:1).    |
| `sobreAcento`  | `#1a1612` | Texto sobre el oro (5:1).                            |
| `acentoHover`  | `#bc9244` | Hover del botón.                                     |
| `led` (fijo)   | `#ff2d20` | Luz del cuarto. Token de Tailwind, no editable.      |

**La pared de noche** (`PARED_OSCURA` en `Vitrina.tsx`) redefine `--marca-*` y `--color-*` solo en esa
sección: fondo `#0b0a09`, texto `#f3ece0` y oro `#e7b94c`. No cambia con el editor de colores.

**La regla del oro escaso.** Fuera de la pared, nada de «una palabra dorada» por título.

**La regla del LED.** El rojo nunca lleva texto. Es la tira encendida (`.tira-led`) y su luz.

## 3. Typography

- **Display** (`texto-cartel`, Big Shoulders 900, mayúscula, hasta 7,75rem): titular de portada y cierre. Una vez por pantalla, en color sólido.
- **Headline** (`font-display`, clamp(2.5rem, 6vw, 4.75rem)): títulos de sección. Sin antetítulo encima.
- **Body** (Manrope 400): párrafos de máximo 40–60ch, en `texto-suave`.
- **Lápiz** (`lapiz`): medidas y datos pequeños, con cifras tabulares.

## 4. Elevation

- **Cuadro colgado** (`sombra-cuadro`): sombra suave que cae hacia abajo, como con luz de techo.
- **Acrílico** (`sombra-acrilico`): borde claro de 1px, sombra más marcada y un reflejo diagonal.
- Interfaz plana: header sólido (sin vidrio), botones sin resplandor.

## 5. Components

- **Botón principal** (`boton boton-oro`): pastilla dorada de 48 px; hover a oro claro.
- **Acción secundaria** (`enlace-fuerte`): texto subrayado en oro, sin caja.
- **Abanico de la portada**: siete diseños del catálogo sobre la tira LED; se abre con `@property --abre`.
- **Catálogo** (`Vitrina.tsx`): filtros en pastilla (`aria-pressed`), tarjetas 3:4 con brillo que sigue al cursor (sin giro 3D).
- **Pared** (`Vitrina.tsx`): cuarto, sala o estudio a escala real (1 cm = `100cqw / ancho`), LED encendible, clavo y cuerda.
- **Personalizado**: la foto en un celular → el mismo cuadro colgado en acrílico. No hay zona falsa de «suelta tu imagen».
- **Montajes** (`Montaje.astro`): cuadros del catálogo colgados en cuartos generados, mientras no haya fotos de clientes.
- **Proceso**: tres pasos en fila con una regla arriba y el número en grande. Sin tarjetas.

## 6. Do's and Don'ts

- **Do** reemplazar los montajes por fotos reales de clientes y el arte del catálogo por fotos (`negocio.catalogo[].foto`).
- **Do** dejar los cuartos ilustrados de noche: el LED solo se luce a oscuras.
- **Do** respetar `prefers-reduced-motion`: sin abanico animado ni columpio.
- **Don't** texto con degradado, antetítulos en mayúscula espaciada sobre cada sección ni «una palabra en oro» por título.
- **Don't** grano, rayos girando, manchas de luz difusa sin fuente, vidrio esmerilado ni sombras duras de afiche.
- **Don't** cajas punteadas de «aquí va una foto»: o hay imagen (real o generada), o no hay caja.
- **Don't** rayas largas (—) en los textos.
