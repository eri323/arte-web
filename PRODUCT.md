# Product

## Register

brand

## Users

Gente joven de Colombia (sobre todo 18 a 30 años) que ve un reel o una historia en Instagram y toca el link del perfil. Llegan desde el celular, casi siempre dentro del navegador interno de Instagram, con poca paciencia y datos móviles. Quieren convertir una foto propia (su perro, su pareja, un viaje, un concierto) en un cuadro para su cuarto o para regalar, y saber rápido cuánto cuesta y si su foto sirve.

El segundo usuario es el dueño del taller: un emprendedor joven de Medellín que vende cuadros en MDF y acrílico, muestra su proceso en redes y quiere una web que sienta suya, no una plantilla. La demo existe para ofrecérsela a él (y, cambiando contenido y `negocio.ts`, a otros emprendimientos parecidos, como una marca de ropa).

## Product Purpose

Que el cliente pase de «me gustó ese cuadro en Instagram» a «ya pedí el mío» sin preguntar por chat medidas, precios ni si su foto sirve. La primera pantalla dice qué es en una frase y una imagen; abajo se ve cómo quedan los cuadros, las medidas a escala, los materiales y cómo se paga. El éxito: el cliente llega a `/crear`, y el dueño del taller ve la demo y piensa «esto es mi marca».

## Brand Personality

**Estudio de afiches de barrio.** Hecho a mano, con calle, sin pose.

- Voz: directa, cercana, de tú, frases cortas. Habla como el muchacho del taller, no como una agencia.
- Emoción buscada: ganas («quiero el mío»), confianza («esto lo hace alguien que sabe») y orgullo local.
- Las obras son las protagonistas; la marca se nota en la tipografía grande, un color fuerte y detalles de oficio (cinta, canto del MDF, medidas a lápiz), usados con medida.

## Anti-references

- Plantilla de Shopify: banner, fila de tarjetas iguales e íconos de «pago seguro / envío / calidad».
- El look anterior de esta demo: negro con dorado genérico de «lujo».
- Tienda de Instagram recargada: muchos colores, stickers y mayúsculas por todos lados.
- Web corporativa o de software: fría, ordenada en cajas, sin imagen.
- Cualquier cosa que «grite IA»: degradados morados, vidrio esmerilado, serif itálica editorial por reflejo, tarjetas con ícono-título-texto repetidas.

## Design Principles

1. **Una idea por pantalla.** La portada dice qué es con una frase y una imagen; cada sección de abajo tiene un solo trabajo.
2. **Mostrar, no contar.** Los cuadros se ven colgados y a escala real; las medidas se entienden mirando, no leyendo una tabla.
3. **El oficio se nota.** Detalles físicos del taller (cinta, canto, lápiz) dan la firma; nada que parezca hecho en serie.
4. **Hecho para el celular dentro de Instagram.** Carga rápida, poco JS, objetivos táctiles grandes y la acción principal siempre a mano.
5. **Plantilla con alma.** Todo lo que es del taller (nombre, colores, fotos, textos) sale de `negocio.ts`, para que otro emprendimiento la sienta suya cambiando contenido, no código.

## Accessibility & Inclusion

- WCAG 2.1 AA: contraste 4.5:1 en texto normal y 3:1 en texto grande; el color de marca nunca es el único portador de información.
- Objetivos táctiles de al menos 44 px; sin scroll horizontal a 375 px.
- Toda animación respeta `prefers-reduced-motion` y la página se entiende sin ella.
- Sin JS la página de inicio se ve completa (Astro estático); axe sin violaciones serias en cada página.
