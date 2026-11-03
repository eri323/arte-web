import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { irA } from './utilidades';

const variable = (page: Page, nombre: string) =>
  page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(),
    nombre,
  );

// El botón principal de la portada va en el color de firma.
const botonPortada = (page: Page) =>
  page
    .getByRole('link', { name: 'Ver catálogo' })
    .evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe('colores de la marca', () => {
  test('una paleta del panel cambia todo el sitio y se puede volver a la original', async ({
    page,
  }) => {
    await irA(page, '/taller');
    await page.getByRole('button', { name: 'Cobalto' }).click();
    await expect(page.getByRole('button', { name: 'Cobalto' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await variable(page, '--marca-acento')).toBe('#2445c2');

    await irA(page, '/');
    expect(await botonPortada(page)).toBe('rgb(36, 69, 194)');
    const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => v.id)).toEqual([]);

    await irA(page, '/taller');
    await page.getByRole('button', { name: 'Volver a los colores originales' }).click();
    expect(await variable(page, '--marca-acento')).toBe('#e7b94c');
    await irA(page, '/');
    expect(await botonPortada(page)).toBe('rgb(231, 185, 76)');
  });

  test('una combinación ilegible avisa y no se guarda', async ({ page }) => {
    await irA(page, '/taller');
    await page.getByRole('button', { name: 'Monte' }).click();
    await page.getByLabel(/^Texto/).fill('#eeeeee');
    await expect(page.getByText(/hay textos que no se leerían/)).toBeVisible();
    // El sitio sigue con la última paleta legible (Monte).
    expect(await variable(page, '--marca-acento')).toBe('#2f6b4f');
    expect(await variable(page, '--marca-texto')).toBe('#1b2420');
  });

  test('el footer lleva al editor de colores', async ({ page }) => {
    await irA(page, '/');
    await page.getByRole('link', { name: 'Prueba otros colores de marca' }).click();
    await expect(page.getByRole('heading', { name: 'Colores de la marca' })).toBeVisible();
  });
});
