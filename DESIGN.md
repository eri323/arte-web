---
name: Áurea Estudio (demo arte-web)
description: Estudio de afiches de barrio. Cuadros a partir de tu foto, con calle y oficio.
colors:
  cal: '#f4efe7'
  cal-sombra: '#ebe1d5'
  tinta: '#231814'
  tinta-suave: '#5c4c45'
  bermellon: '#ca3517'
  bermellon-fuerte: '#a52110'
  cinta: '#e7d2a0'
  linea: '#23181426'
  linea-fuerte: '#23181440'
typography:
  display:
    fontFamily: 'Archivo Variable, Arial Black, sans-serif'
    fontSize: 'clamp(3rem, 13vw, 8rem)'
    fontWeight: 850
    lineHeight: 0.9
    letterSpacing: '-0.03em'
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: 'Archivo Variable, Arial Black, sans-serif'
    fontSize: 'clamp(2rem, 6.5vw, 4rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 115"
  title:
    fontFamily: 'Archivo Variable, Arial, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: 'Archivo Variable, Arial, sans-serif'
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.55
  lapiz:
    fontFamily: 'Archivo Variable, Arial Narrow, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: '0.01em'
    fontVariation: "'wdth' 70"
rounded:
  sm: '2px'
  md: '4px'
spacing:
  gutter: '16px'
  seccion: 'clamp(4rem, 12vw, 9rem)'
components:
  button-primary:
    backgroundColor: '{colors.bermellon}'
    textColor: '{colors.cal}'
    rounded: '{rounded.sm}'
    padding: '14px 28px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.bermellon-fuerte}'
  button-on-color:
    backgroundColor: '{colors.tinta}'
    textColor: '{colors.cal}'
    rounded: '{rounded.sm}'
    padding: '14px 28px'
    height: '48px'
  input:
    backgroundColor: 'transparent'
    textColor: '{colors.tinta}'
    rounded: '{rounded.md}'
    height: '44px'
---

# Design System: Áurea Estudio

## 1. Overview

**Creative North Star: "El estudio de afiches de barrio"**

La web se siente como el taller de un muchacho de Medellín que imprime cuadros: una pared pintada de un color fuerte, un cuadro colgado con cinta, letras grandes como de afiche pegado en la calle y las medidas anotadas a lápiz. Las obras (las fotos del cliente) son las protagonistas; la marca se nota en el tamaño de la tipografía, en un solo color valiente y en detalles físicos de oficio, usados con medida.

Una idea por pantalla. La portada ocupa una sola pantalla con una frase, un cuadro y un botón. Abajo, cada sección tiene su propio mundo visual (una pared de galería a escala, dos materiales lado a lado, una franja de pago) en lugar de una fila de tarjetas iguales.

Rechaza: la plantilla de Shopify con íconos de confianza, el negro con dorado de «lujo», la tienda de Instagram recargada, la web corporativa y todo lo que grite IA (degradados morados, vidrio, serif itálica editorial, tarjetas ícono-título-texto).

**Key Characteristics:**

- Tema claro: fondo de cal, como una pared; los cuadros se ven como en una casa.
- Un color de firma (bermellón) que se adueña de la portada y del cierre; en el resto aparece poco.
- Una sola familia (Archivo) jugando con el ancho: expandida y pesada para gritar, condensada para anotar.
- Esquinas casi rectas, sin pastillas; cosas físicas tienen sombra, la interfaz es plana.
- Fotos propias del taller tienen su lugar (`negocio.vitrina`); mientras no existan, escenas generadas en SVG.

## 2. Colors: La paleta de pared y tinta

Cal, tinta y un bermellón de afiche. Estrategia **Committed**: el bermellón cubre la portada entera y el cierre; en las secciones intermedias baja a acentos.

### Primary

- **Bermellón de afiche** (#ca3517 / oklch(0.555 0.19 33)): fondo de la portada y del cierre, botón principal, marcas de medida. Cal sobre bermellón da 4.57:1.
- **Bermellón quemado** (#a52110 / oklch(0.47 0.17 31)): hover del botón y todo texto de acento en tamaño normal (6.52:1 sobre cal).

### Neutral

- **Cal** (#f4efe7 / oklch(0.955 0.012 80)): fondo general, la pared.
- **Cal en sombra** (#ebe1d5 / oklch(0.915 0.02 75)): superficies y bandas alternas.
- **Tinta** (#231814 / oklch(0.22 0.02 40)): texto y botón sobre color. Nunca negro puro.
- **Tinta suave** (#5c4c45 / oklch(0.43 0.025 45)): texto secundario (6.35:1 sobre cal en sombra).
- **Línea** (tinta al 15% y 25%): bordes y divisores.
- **Cinta** (#e7d2a0): solo decoración, la cinta de enmarcar. Nunca lleva texto.

### Named Rules

**La regla de la pared pintada.** El bermellón como fondo solo en la portada y en el cierre. Si aparece de fondo en una tercera sección, deja de ser firma y se vuelve ruido.

**La regla del texto quemado.** El texto de acento en tamaño normal va en bermellón quemado; el bermellón claro solo en texto de 24 px o más, o como fondo.

**La regla de la paleta editable.** El taller solo elige tres colores (firma, pared y texto) en `/taller`. El resto (`superficie`, `textoSuave`, `acentoFuerte`, `sobreAcento`, `acentoHover`, líneas) lo deriva `src/lib/paleta.ts` para que todo pase AA, y una combinación ilegible no se guarda. Por eso ningún componente debe asumir que el texto es oscuro o que el acento es rojo: texto sobre el color de firma va en `sobre-acento`, y el hover de los botones en `acento-hover`.

## 3. Typography

**Familia única:** Archivo Variable (Omnibus-Type), con ejes de peso 100–900 y ancho 62–125%.

**Character:** una grotesca de cartel. Expandida y negra parece letrero pintado o afiche de concierto; condensada parece la anotación a lápiz del taller. El contraste sale del ancho y del peso, no de mezclar familias.

### Hierarchy

- **Display** (850, ancho 125%, clamp(3rem, 13vw, 8rem), interlineado 0.9): solo la frase de la portada y del cierre.
- **Headline** (800, ancho 115%, clamp(2rem, 6.5vw, 4rem), 0.95): títulos de sección.
- **Title** (700, 1.25rem, 1.2): subtítulos, nombres de material, preguntas.
- **Body** (400, 1.0625rem, 1.55): párrafos, máximo 60ch.
- **Lápiz** (500, ancho 70%, 0.875rem): medidas en cm, notas al lado de los cuadros, datos pequeños. En bermellón quemado o tinta suave.

### Named Rules

**La regla del grito único.** Una sola línea Display por pantalla. Los títulos de sección no compiten con ella.

**La regla sin mayúsculas sostenidas.** Nada de etiquetas en mayúscula espaciada encima de cada título; la jerarquía la dan el ancho y el tamaño.

## 4. Elevation

La interfaz es plana: paneles, campos y botones no tienen sombra; se separan por tono (cal y cal en sombra) y por línea. La sombra existe solo para objetos físicos colgados en la pared, y siempre cae hacia abajo como luz de techo.

### Shadow Vocabulary

- **Cuadro colgado** (`box-shadow: 0 1px 1px #23181430, 0 18px 30px -12px #23181466`): cuadros en la portada y en la pared de galería.
- **Acrílico** (`box-shadow: 0 2px 2px #23181440, 0 24px 40px -14px #23181480`): la versión acrílico, un poco más marcada.

## 5. Components

### Buttons

- **Shape:** esquinas casi rectas (2px), alto mínimo 48px.
- **Primary:** bermellón con texto cal, peso 700, ancho 110%. Hover: bermellón quemado. Al presionar baja 1px.
- **Sobre color:** en la portada y el cierre (fondo bermellón) el botón invierte el par: fondo `sobreAcento` (cal) y texto bermellón. Así funciona con cualquier paleta que elija el taller. Hover: contorno de 2px.
- **Secundario:** enlace subrayado grueso (2px, separado 4px), sin caja.
- **Focus:** contorno de 3px en tinta (o cal sobre bermellón) con separación de 3px.

### Cuadro (marco)

- El arte o la foto va dentro de un marco de 6–10px (canto de MDF en tinta, o borde claro con reflejo para acrílico), con la sombra «cuadro colgado».
- Opcional: un trozo de cinta (color cinta, rotado unos grados) en una esquina superior. Máximo una cinta por pantalla.
- Al lado o debajo, la medida en estilo Lápiz con una línea de cota.

### Inputs y opciones

- Borde línea-fuerte, radio 4px, alto 44px, fondo transparente. Seleccionado: borde bermellón y fondo bermellón al 8%.

### Navegación

- Barra clara con el nombre de la marca en Headline pequeño (ancho 115%) y enlaces en Body 15px; el contador del carrito es una cifra en bermellón.

### Movimiento

- Entrada de la portada: la frase sube y el cuadro «se cuelga» (baja 24px y gira de 3° a su ángulo), ease-out-expo, 700–900 ms, escalonado 120 ms.
- Secciones: aparición suave al entrar en pantalla con `animation-timeline: view()` donde exista; sin ella, todo se ve quieto.
- Todo se apaga con `prefers-reduced-motion: reduce`.

## 6. Do's and Don'ts

### Do:

- **Do** dejar que una pantalla tenga una sola idea y mucho aire.
- **Do** mostrar los cuadros colgados y a escala real; las medidas en estilo Lápiz con cota.
- **Do** sacar nombre, colores, textos y fotos de `negocio.ts` para que otro taller (o una marca de ropa) la sienta suya.
- **Do** usar bermellón quemado para texto de acento pequeño.

### Don't:

- **Don't** volver al negro con dorado ni a fondos oscuros genéricos.
- **Don't** filas de tarjetas iguales con ícono, título y texto, ni íconos de «pago seguro / envío / calidad».
- **Don't** botones en pastilla, degradados en texto, vidrio esmerilado ni sombras en la interfaz plana.
- **Don't** stickers, emojis decorativos ni mayúsculas por todos lados (la «tienda de Instagram recargada»).
- **Don't** usar fotos de negocios reales; las imágenes son generadas o del propio taller.
