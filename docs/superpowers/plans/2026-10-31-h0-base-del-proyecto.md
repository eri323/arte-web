# H0: base del proyecto — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el repo `arte-web` con Astro estático, TS estricto, React, Tailwind, nanostores, Vitest, Playwright, ESLint y Prettier funcionando; `negocio.ts` con los datos de la sección 6; `Base.astro` con header y footer; `/` provisional; una e2e de humo; y el primer push a `main`.

**Architecture:** Proyecto Astro de salida estática creado a mano en la carpeta actual (no con `create-astro`, porque la carpeta ya tiene `CLAUDE.md` y `docs/`). Las integraciones se agregan con `npx astro add`. Los colores de marca salen de `negocio.ts` y se inyectan como variables CSS en `Base.astro`; Tailwind v4 las expone como utilidades con `@theme`.

**Tech Stack:** Astro, React (`@astrojs/react`), Tailwind CSS v4, nanostores, TypeScript estricto, Vitest, Playwright + `@axe-core/playwright`, ESLint (flat config) + Prettier, Fontsource, `sharp` (fixtures).

**Spec:** `CLAUDE.md` (secciones 3, 4, 5, 6, 12, 13, 14, 15, 17 y 18).

## Global Constraints

- Versiones estables actuales, **fijadas exactas** en `package.json` (sin `^` ni `~`). Se logra con `.npmrc` → `save-exact=true` antes del primer `npm install`.
- Solo dependencias de la sección 4, más `sharp` (devDependency, sección 14), `@astrojs/check` y `typescript` (los exige `astro check`). Cualquier otra: preguntar a Erick.
- Fase 1 sin backend: nada de `.env`, servidores ni secretos.
- Dinero en pesos enteros (`number` entero).
- Todo supuesto en código lleva `// SUPUESTO:` y la razón.
- Identificadores de dominio en español (`medidas`, `precio`), lo técnico en inglés.
- Scripts multiplataforma: nada de `rm -rf` ni sintaxis solo de bash. `&&` en scripts de npm sí funciona en Windows.
- Footer visible con el texto exacto: `Demo · marca ficticia`.
- `og:locale` = `es_CO`.
- No desplegar. Push solo a `main` con la identidad de eri323 (sección 15 y 18).

## Review Focus

1. **Saltos de línea en Windows:** `.gitattributes` (`* text=auto eol=lf`) tiene que existir **antes** del primer `git add`, o el primer commit entra con CRLF. → Task 1 lo crea primero; Task 7 verifica con `git ls-files --eol`.
2. **Scroll horizontal a 375 px:** el header con nav puede desbordar en móvil. → e2e de humo en Task 6 compara `scrollWidth <= clientWidth` en el proyecto móvil.
3. **Contraste AA del dorado y del gris:** los tokens de color pueden quedar bajo 4,5:1. → axe en la e2e de humo (Task 6), sin violaciones `serious` ni `critical`.
4. **Datos de negocio no enteros o mal escritos:** un precio con decimales o una medida con `anchoCm > altoCm` rompería H1. → test de `negocio.ts` en Task 2.
5. **Navegadores de Playwright no instalados en una máquina limpia:** `npm run test:e2e` falla con un error poco claro. → Task 6 documenta e instala `npx playwright install chromium`.

---

### Task 0: Verificar que «Áurea Estudio» no sea un negocio real

**Files:** ninguno (resultado en el resumen a Erick).

- [ ] **Step 1:** Buscar en la web: `"Áurea Estudio" cuadros Colombia`, `"Aurea Estudio" cuadros MDF`, `"aureaestudio" instagram cuadros`.
- [ ] **Step 2:** Si aparece un negocio real de cuadros, arte o impresión en Colombia con ese nombre, **detenerse** y proponer a Erick 2 o 3 nombres alternativos (cada uno ya buscado). Si no aparece, seguir con «Áurea Estudio» y prefijo `AE`.

### Task 1: Esqueleto Astro con TS estricto, React, Tailwind y nanostores

**Files:**

- Create: `.gitattributes`, `.gitignore`, `.npmrc`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts` (si Astro lo pide), `src/pages/index.astro` (mínimo, se reemplaza en Task 3), `src/styles/global.css` (lo crea `astro add tailwind`)

**Interfaces:**

- Produces: scripts `dev`, `build`, `preview`, `check` en `package.json`; `@/*` → `src/*` en `tsconfig.json`.

- [ ] **Step 1:** Crear `.gitattributes` con `* text=auto eol=lf`; `.gitignore` con `node_modules`, `dist`, `.astro`, `playwright-report`, `test-results`, `.env*`; `.npmrc` con `save-exact=true`.
- [ ] **Step 2:** `npm init -y`; poner `"name": "arte-web"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=22.12.0" }` (piso de Astro actual; ajustar al que diga la doc de la versión instalada).
- [ ] **Step 3:** `npm install astro` y `npm install -D @astrojs/check typescript`.
- [ ] **Step 4:** `astro.config.mjs` con `output: 'static'`. `tsconfig.json` que extienda `astro/tsconfigs/strict`, con `include: [".astro/types.d.ts", "**/*"]`, `exclude: ["dist"]` y `compilerOptions.paths: { "@/*": ["src/*"] }`.
- [ ] **Step 5:** `npx astro add react --yes` y `npx astro add tailwind --yes`. Revisar que `package.json` quede sin `^`/`~`; si `astro add` metió rangos, quitarlos a mano.
- [ ] **Step 6:** `npm install nanostores @nanostores/react @nanostores/persistent`.
- [ ] **Step 7:** Scripts: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`, `"check": "astro check"`.
- [ ] **Step 8:** `src/pages/index.astro` mínimo que importe `../styles/global.css` y muestre un `<h1>`.
- [ ] **Step 9:** Verificar: `npm run check` → `0 errors`; `npm run build` → genera `dist/index.html`.
- [ ] **Step 10:** No commitear aún (el primer commit va en Task 7 tras revisar identidad). Si se ejecuta con subagentes, el revisor revisa el working tree.

### Task 2: `negocio.ts` con tipos, datos y su prueba (incluye Vitest)

**Files:**

- Create: `src/config/negocio.ts`, `src/config/negocio.test.ts`, `vitest.config.ts`
- Modify: `package.json` (script `test`)

**Interfaces:**

- Produces (exportados desde `src/config/negocio.ts`):
  - `type Promocion = { tipo: 'desde'; cantidadMinima: number; precioUnitario: number } | { tipo: 'paquete'; cantidad: number; precioPaquete: number }`
  - `interface Medida { id: string; anchoCm: number; altoCm: number; precio: number; promocion?: Promocion }`
  - `type MaterialId = 'mdf' | 'acrilico'`
  - `type Orientacion = 'vertical' | 'horizontal'`
  - `interface Negocio` exactamente como en la sección 6 del spec, más `marca.prefijoPedido: string` y `marca.colores` con las claves de abajo.
  - `export const negocio: Negocio` (default export no; export con nombre).

- [ ] **Step 1:** `npm install -D vitest`. `vitest.config.ts` con `getViteConfig` de `astro/config`, `test.include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts']`. Script `"test": "vitest run"`.
- [ ] **Step 2: Escribir el test que falla** (`src/config/negocio.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { negocio } from './negocio';

describe('negocio', () => {
  it('tiene las 6 medidas de la sección 6 con sus precios', () => {
    expect(negocio.medidas.map((m) => [m.id, m.anchoCm, m.altoCm, m.precio])).toEqual([
      ['20x27', 20, 27, 30000],
      ['30x40', 30, 40, 60000],
      ['45x60', 45, 60, 80000],
      ['60x80', 60, 80, 130000],
      ['90x120', 90, 120, 250000],
      ['120x160', 120, 160, 330000],
    ]);
  });

  it('tiene las promociones de la sección 6', () => {
    const promo = Object.fromEntries(negocio.medidas.map((m) => [m.id, m.promocion]));
    expect(promo['20x27']).toEqual({ tipo: 'desde', cantidadMinima: 5, precioUnitario: 15000 });
    expect(promo['30x40']).toEqual({ tipo: 'desde', cantidadMinima: 3, precioUnitario: 40000 });
    expect(promo['45x60']).toEqual({ tipo: 'paquete', cantidad: 2, precioPaquete: 130000 });
    expect(promo['60x80']).toBeUndefined();
    expect(promo['90x120']).toBeUndefined();
    expect(promo['120x160']).toBeUndefined();
  });

  it('guarda todo el dinero como enteros', () => {
    for (const m of negocio.medidas) {
      expect(Number.isInteger(m.precio)).toBe(true);
      if (m.promocion?.tipo === 'desde')
        expect(Number.isInteger(m.promocion.precioUnitario)).toBe(true);
      if (m.promocion?.tipo === 'paquete')
        expect(Number.isInteger(m.promocion.precioPaquete)).toBe(true);
    }
    for (const mat of negocio.materiales) expect(mat.recargo).toBe(0);
  });

  it('define las medidas en vertical (ancho < alto)', () => {
    for (const m of negocio.medidas) expect(m.anchoCm).toBeLessThan(m.altoCm);
  });

  it('trae los valores por defecto de la sección 6', () => {
    expect(negocio.marca.nombre).toBe('Áurea Estudio');
    expect(negocio.marca.prefijoPedido).toBe('AE');
    expect(negocio.orientaciones).toEqual(['vertical', 'horizontal']);
    expect(negocio.resolucion).toEqual({ buena: 150, regular: 100 });
    expect(negocio.archivo).toEqual({
      tamanoMaxMB: 25,
      tipos: ['image/jpeg', 'image/png', 'image/webp'],
    });
    expect(negocio.whatsapp.numero).toBe('');
    expect(negocio.pagos.porcentajeAbono).toBe(50);
    expect(negocio.envio.texto).toBe('Se cotiza por WhatsApp según tu ciudad');
  });
});
```

- [ ] **Step 3:** `npm test` → FAIL (no existe `./negocio`).
- [ ] **Step 4:** Implementar `src/config/negocio.ts` con los tipos y los datos. Valores que no da el spec (decisión del plan):
  - `marca.eslogan`: `'Tus fotos, convertidas en cuadros'`.
  - `marca.colores`: `{ fondo: '#0f0d0b', superficie: '#1a1714', texto: '#f2ede4', textoSuave: '#b9b1a3', dorado: '#d4af6a', doradoOscuro: '#a8843f' }`.
  - `materiales`: `mdf` («MDF», mate, canto oscuro) y `acrilico` («Acrílico», brillante), ambos `recargo: 0` con `// SUPUESTO: el material no cambia el precio`.
  - Comentarios `// SUPUESTO:` para: promociones por medida sumando ítems; fórmula de `paquete`; orientación horizontal con mismo precio; umbrales de dpi; abono con `Math.ceil`; `whatsapp.numero` vacío = modo demo.
- [ ] **Step 5:** `npm test` → 5 passed. `npm run check` → 0 errors.

### Task 3: `Base.astro`, Header, Footer, fuentes y `/` provisional

**Files:**

- Create: `src/layouts/Base.astro`, `src/components/ui/Header.astro`, `src/components/ui/Footer.astro`
- Modify: `src/styles/global.css`, `src/pages/index.astro`, `astro.config.mjs` (`site`)

**Interfaces:**

- Consumes: `negocio` de Task 2.
- Produces: `Base.astro` con props `{ title: string; description: string; ogImage?: string }` (default de `ogImage`: `'/og/inicio.png'`; la imagen real se crea en H6).

- [ ] **Step 1:** `npm install @fontsource/cormorant-garamond @fontsource-variable/inter`. Importar en `global.css` solo los pesos usados (Cormorant 500 y 600; Inter variable).
- [ ] **Step 2:** `global.css`: `@import "tailwindcss";` y un bloque `@theme` que mapee `--color-fondo`, `--color-superficie`, `--color-texto`, `--color-texto-suave`, `--color-dorado`, `--color-dorado-oscuro` a `var(--marca-<clave>)`, más `--font-serif` y `--font-sans`. `body` con fondo y texto de marca.
- [ ] **Step 3:** `Base.astro`: `<html lang="es-CO">`, `<meta charset>`, viewport, `<title>{title} · {negocio.marca.nombre}</title>`, `description`, `og:title`, `og:description`, `og:image` (URL absoluta con `Astro.site`), `og:type=website`, `og:locale=es_CO`. En `<head>`, un `<style>` que declare `:root { --marca-fondo: …; … }` generado desde `negocio.marca.colores` (camelCase → kebab-case). Luego `<Header />`, `<main><slot /></main>`, `<Footer />`.
- [ ] **Step 4:** `astro.config.mjs` → `site: 'https://arte-web.example'` con `// SUPUESTO: dominio provisional; Erick lo cambia al desplegar`.
- [ ] **Step 5:** `Header.astro`: nombre de la marca (link a `/`) y nav a `/formatos`, `/crear`, `/pedido`, `/seguimiento`. En 375 px la nav pasa a una fila con scroll interno o se reduce a íconos de texto corto; sin desborde de página. Objetivos táctiles de mínimo 44 px. Sin contador del carrito todavía (es H4).
- [ ] **Step 6:** `Footer.astro`: nombre, eslogan y el texto exacto `Demo · marca ficticia`.
- [ ] **Step 7:** `index.astro` provisional con `Base` (`title="Inicio"`, descripción del eslogan), un hero con `<h1>` serif dorado, un párrafo y un link «Crear mi cuadro» a `/crear`.
- [ ] **Step 8:** `npm run check` → 0 errors; `npm run build` → OK; `npm run dev` y abrir `/` para mirar a 375 px.

### Task 4: ESLint y Prettier

**Files:**

- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (scripts `lint`, `format`)

- [ ] **Step 1:** `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-astro prettier prettier-plugin-astro`.
- [ ] **Step 2:** `eslint.config.js` (flat): `js.configs.recommended`, `tseslint.configs.recommended`, `astro.configs.recommended`; `ignores: ['dist', '.astro', 'node_modules', 'playwright-report', 'test-results']`.
- [ ] **Step 3:** `.prettierrc.json`: `{ "singleQuote": true, "printWidth": 100, "plugins": ["prettier-plugin-astro"], "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }] }`. `.prettierignore`: `dist`, `.astro`, `package-lock.json`.
- [ ] **Step 4:** Scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`.
- [ ] **Step 5:** `npm run format`, luego `npm run lint` → 0 problems.

### Task 5: Script de fixtures

**Files:**

- Create: `scripts/generar-fixtures.mjs`
- Modify: `.gitignore` (agregar `tests/fixtures/*.jpg`)

**Interfaces:**

- Produces: `tests/fixtures/retrato-12mp.jpg` (3024×4032) y `tests/fixtures/pequena.jpg` (800×600); script npm `fixtures`.

- [ ] **Step 1:** `npm install -D sharp`.
- [ ] **Step 2:** Script en Node que, para cada fixture, **si el archivo no existe**, crea la carpeta con `fs.mkdirSync(..., { recursive: true })` y genera un JPEG con `sharp` a partir de un SVG con degradado de las dimensiones exactas (calidad 70, para que pese poco).
- [ ] **Step 3:** Script `"fixtures": "node scripts/generar-fixtures.mjs"`. Correrlo dos veces: la primera crea los archivos, la segunda no hace nada. Verificar dimensiones con `node -e "import('sharp').then(async ({default:s})=>console.log(await s('tests/fixtures/retrato-12mp.jpg').metadata()))"` → `width: 3024, height: 4032`.

> Decisión del plan: los fixtures no se versionan (se regeneran), para no meter binarios al repo público.

### Task 6: Playwright, axe y e2e de humo

**Files:**

- Create: `playwright.config.ts`, `tests/e2e/humo.spec.ts`
- Modify: `package.json` (script `test:e2e`)

**Interfaces:**

- Consumes: fixtures de Task 5 (el script los genera aunque la e2e de humo no los use todavía).

- [ ] **Step 1:** `npm install -D @playwright/test @axe-core/playwright` y `npx playwright install chromium`.
- [ ] **Step 2:** `playwright.config.ts`: `testDir: 'tests/e2e'`; `webServer: { command: 'npm run build && npm run preview -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: !process.env.CI }`; `use.baseURL: 'http://localhost:4321'`; dos proyectos, ambos con Chromium para no instalar WebKit: `movil` (`viewport: { width: 390, height: 844 }`, `isMobile: true`, `hasTouch: true`) y `escritorio` (`Desktop Chrome`).
- [ ] **Step 3:** Script `"test:e2e": "node scripts/generar-fixtures.mjs && playwright test"`.
- [ ] **Step 4: Escribir la e2e** (`tests/e2e/humo.spec.ts`):

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('la página de inicio carga con marca, footer de demo y metadatos', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Áurea Estudio/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Demo · marca ficticia')).toBeVisible();
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_CO');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https?:\/\//,
  );
});

test('no hay scroll horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda).toBe(false);
});

test('axe no encuentra violaciones serias en /', async ({ page }) => {
  await page.goto('/');
  const { violations } = await new AxeBuilder({ page }).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => v.id)).toEqual([]);
});
```

- [ ] **Step 5:** `npm run test:e2e` → 6 passed (3 tests × 2 proyectos). Si falla axe por contraste, ajustar los tokens en `negocio.ts` (no en el CSS).

### Task 7: Cierre del hito, identidad y primer push

**Files:**

- Modify: `CLAUDE.md` (sección 19: marcar H0)

- [ ] **Step 1:** Correr en verde, en este orden: `npm run check`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`.
- [ ] **Step 2:** Revisar identidad: `git config user.name` (esperado `eri323`), `git config user.email` (esperado `131095100+eri323@users.noreply.github.com`), `gh auth status` (cuenta activa `eri323`). Si algo no coincide: **detenerse y preguntar a Erick**.
- [ ] **Step 3:** En `CLAUDE.md`, marcar `- [x] H0: base del proyecto`.
- [ ] **Step 4:** `git add -A` y revisar `git status` (no deben entrar `node_modules`, `dist`, `.astro` ni fixtures). Verificar `git ls-files --eol` → ningún archivo con `i/crlf`.
- [ ] **Step 5:** Commits pequeños en español, por ejemplo: `chore: base de Astro con React, Tailwind y nanostores`, `feat: configuración del negocio con medidas y promociones`, `feat: layout base con header y footer de demo`, `chore: ESLint, Prettier, Vitest y Playwright con prueba de humo`, `docs: plan de H0 y decisiones en CLAUDE.md`. Cada uno con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- [ ] **Step 6:** `git push -u origin main`.
- [ ] **Step 7:** Resumen a Erick: qué se hizo, qué probar con `npm run dev`, resultado de la búsqueda del nombre, versiones instaladas y decisiones del plan (colores, eslogan, fixtures sin versionar, Chromium en los dos proyectos, `site` provisional).
