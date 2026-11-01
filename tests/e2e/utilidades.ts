import type { Page } from '@playwright/test';

/** Va a la ruta y espera a que todas las islas de Astro estén hidratadas (sin atributo `ssr`). */
export async function irA(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}
