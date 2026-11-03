---
name: Midas Atelier (propuesta web sobre arte-web)
description: Cuarto oscuro iluminado por LED rojo. El dorado del logo solo en lo que importa.
colors:
  negro: '#0b0a09'
  negro-2: '#15120f'
  hueso: '#f3ece0'
  gris: '#a39a8e'
  oro: '#e7b94c'
  oro-claro: '#f6d88b'
  led: '#ff2d20'
  linea: '#f3ece01f'
  linea-fuerte: '#f3ece040'
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

**Creative North Star: "El cuarto a las 11 p. m., con la tira LED prendida"**

Escena: un muchacho de 22 años en Medellín, en su cuarto con la tira LED roja encendida, abre el link
de la bio de Instagram en el celular. El fondo oscuro sale de ahí, no de «lujo». Los cuadros son los
protagonistas y se ven colgados; la tira LED es un objeto literal (una línea encendida que ilumina la
pared), no una mancha de color de fondo.

- Tema oscuro (`color-scheme: dark`), sin grano ni texturas decorativas.
- El oro del logo solo en el logo, los precios, el botón principal y la barra del abono. Los títulos van en hueso.
- El rojo LED es luz: la tira de la portada y del cierre, el resplandor detrás del cuadro en la pared y los montajes.
- Portada asimétrica: titular a la izquierda, cuadros colgados sobre la tira a la derecha.
- Movimiento con ease-out expo. El único «rebote» es el columpio del cuadro en su clavo (física, no adorno).

## 2. Colors

Todos salen de `negocio.marca.colores` (variables `--marca-*`), así el panel del taller los puede cambiar.

| Token         | Valor     | Uso                                                   |
| ------------- | --------- | ----------------------------------------------------- |
| `fondo`       | `#0b0a09` | Fondo general.                                        |
| `superficie`  | `#15120f` | Bandas alternas y paneles.                            |
| `texto`       | `#f3ece0` | Texto y títulos (16,8:1 sobre fondo).                 |
| `textoSuave`  | `#a39a8e` | Texto secundario (6,7:1 sobre superficie).            |
| `acento`      | `#e7b94c` | Oro: botón, precios, barra del abono.                 |
| `acentoHover` | `#f6d88b` | Oro claro: hover del botón.                           |
| `sobreAcento` | `#0b0a09` | Texto sobre el oro (10,8:1).                          |
| `cinta`       | `#f6d88b` | Decoración (cotas de medida en la pared).             |
| `led` (fijo)  | `#ff2d20` | Luz del cuarto. Token de Tailwind `led`, no editable. |

**La regla del oro escaso.** Nada de «una palabra dorada» en cada título. Si el oro aparece, es porque
se puede tocar (botón) o porque es plata (precio, abono).

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
- **Do** respetar `prefers-reduced-motion`: sin abanico animado ni columpio.
- **Don't** texto con degradado, antetítulos en mayúscula espaciada sobre cada sección ni «una palabra en oro» por título.
- **Don't** grano, rayos girando, manchas de luz difusa sin fuente, vidrio esmerilado ni sombras duras de afiche.
- **Don't** cajas punteadas de «aquí va una foto»: o hay imagen (real o generada), o no hay caja.
- **Don't** rayas largas (—) en los textos.
