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

**Creative North Star: "El cuarto oscuro con LED"**

La web se siente como el cuarto de un cliente de Midas: paredes oscuras, una tira LED roja detrás de
la cama y un cuadro dorado que se lleva la mirada. Los cuadros son los protagonistas y se ven
colgados, con sombra dura de afiche y el resplandor rojo del cuarto.

- Tema oscuro (`color-scheme: dark`) con grano de película encima de todo.
- El dorado del logo solo en lo que importa: palabras clave de los títulos, precios y el botón principal.
- El rojo LED es luz, no texto: degradados de fondo, resplandor detrás del cuadro y la línea de los pasos.
- Títulos condensados, negros y en mayúscula (Big Shoulders Display); texto en Manrope.
- Movimiento con rebote: el abanico de la portada se abre, los cuadros se columpian en su clavo.

## 2. Colors

Todos salen de `negocio.marca.colores` (variables `--marca-*`), así el panel del taller los puede cambiar.

| Token         | Valor     | Uso                                                   |
| ------------- | --------- | ----------------------------------------------------- |
| `fondo`       | `#0b0a09` | Fondo general.                                        |
| `superficie`  | `#15120f` | Bandas alternas y paneles.                            |
| `texto`       | `#f3ece0` | Texto (16,8:1 sobre fondo).                           |
| `textoSuave`  | `#a39a8e` | Texto secundario (6,7:1 sobre superficie).            |
| `acento`      | `#e7b94c` | Oro: botón, precios, palabras resaltadas.             |
| `acentoHover` | `#f6d88b` | Oro claro: hover del botón y brillo del degradado.    |
| `sobreAcento` | `#0b0a09` | Texto sobre el oro (10,8:1).                          |
| `cinta`       | `#f6d88b` | Decoración (cotas de medida en la pared).             |
| `led` (fijo)  | `#ff2d20` | Luz del cuarto. Token de Tailwind `led`, no editable. |

**La regla del oro escaso.** El oro va en una o dos palabras por título, en precios y en el botón
principal. Si todo es dorado, nada lo es.

**La regla del LED.** El rojo nunca lleva texto pequeño. Es luz de fondo y resplandor.

## 3. Typography

- **Display** (Big Shoulders 900, mayúscula): portada y cierre. Una vez por pantalla. La palabra final va con `texto-oro` (degradado dorado).
- **Headline** (Big Shoulders 900, mayúscula): títulos de sección, con una palabra en `text-acento-fuerte`.
- **Antetítulo** (`antetitulo`): línea pequeña espaciada, en oro, con un trazo a la izquierda.
- **Body** (Manrope 400): párrafos de máximo 52–60ch, en `texto-suave`.

## 4. Elevation

- **Cuadro colgado** (`sombra-cuadro`): `5px 5px 0 #000` más un halo oscuro.
- **Acrílico** (`sombra-acrilico`): sombra dura clara y un reflejo diagonal encima.
- Paneles con borde `linea` y radio de 16–20 px. Los botones son pastillas.

## 5. Components

- **Botón principal** (`boton boton-oro`): pastilla dorada de 48 px que sube 2 px al pasar el cursor.
- **Botón secundario** (`boton boton-linea`): pastilla con contorno.
- **Abanico de la portada**: siete diseños del catálogo; se abre con `@property --abre` y se alza el que tiene el cursor.
- **Catálogo**: filtros en pastilla (`aria-pressed`), tarjetas 3:4 con brillo que sigue al cursor y giro 3D leve.
- **Pared** (`Vitrina.tsx`): cuarto, sala o estudio a escala real (1 cm = `100cqw / ancho`), con LED encendible, clavo y cuerda.
- **Proceso y clientes**: huecos punteados donde van los videos y fotos reales del taller.

## 6. Do's and Don'ts

- **Do** usar fotos reales del taller en `negocio.catalogo[].foto` y en el muro de clientes.
- **Do** respetar `prefers-reduced-motion`: sin rayos girando, sin columpio, sin abanico animado.
- **Don't** usar el rojo LED como color de texto o de botón.
- **Don't** llenar de oro: fondos dorados solo en el botón y en la barra del abono.
