import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const graves = async (page: import('@playwright/test').Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);

test.describe('páginas de contenido', () => {
  test('la portada tiene los pasos, la galería, pagos y preguntas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible();
    await expect(page.getByText('Sube tu foto', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Atardecer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pagas 50% y 50%/ })).toBeVisible();
    await page.getByText('¿Cuánto cuesta el envío?').click();
    await expect(page.getByText(/Se cotiza por WhatsApp según tu ciudad/).first()).toBeVisible();
    expect(await graves(page)).toEqual([]);
  });

  test('/formatos muestra la tabla con promociones y la escala', async ({ page }) => {
    await page.goto('/formatos');
    const filas = page.getByRole('table').getByRole('row');
    await expect(filas).toHaveCount(7);
    await expect(page.getByRole('row', { name: /30×40/ })).toContainText(/60\.000/);
    await expect(page.getByRole('row', { name: /30×40/ })).toContainText(
      /3 o más a \$\s40\.000 c\/u/,
    );
    await expect(page.getByRole('row', { name: /45×60/ })).toContainText(/2 por \$\s130\.000/);
    await expect(page.getByRole('img', { name: /sofá de 200 cm/ })).toBeVisible();
    expect(await graves(page)).toEqual([]);
  });

  test('/formatos usa los precios editados en el panel', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('arte-web:precios', JSON.stringify({ '30x40': { precio: 65000 } }));
    });
    await page.goto('/formatos');
    await expect(page.getByRole('row', { name: /30×40/ })).toContainText(/65\.000/);
  });

  test('sin scroll horizontal en /formatos a 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/formatos');
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(desborda).toBe(false);
  });
});
