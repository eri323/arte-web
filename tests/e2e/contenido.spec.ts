import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

const graves = async (page: import('@playwright/test').Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);

test.describe('páginas de contenido', () => {
  test('la portada tiene el catálogo, los personalizados, envíos y preguntas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu carro');
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Pósters del catálogo' }).last()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Lo ilustramos y lo enmarcamos' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Así se ven en casa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Envíos y pagos' })).toBeVisible();
    await expect(page.getByText('Cali, Pereira y Manizales').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible();
    expect(await graves(page)).toEqual([]);
  });

  test('/formatos muestra las dos listas de precios, los envíos y la escala', async ({ page }) => {
    await page.goto('/formatos');
    const catalogo = page.getByRole('table', { name: /Del catálogo/ });
    const personalizados = page.getByRole('table', { name: /Personalizados/ });
    await expect(catalogo.getByRole('row')).toHaveCount(11);
    await expect(personalizados.getByRole('row')).toHaveCount(9);
    await expect(catalogo.getByRole('row', { name: /13×18/ })).toContainText(/42\.000/);
    await expect(catalogo.getByRole('row', { name: /70×100/ })).toContainText(/475\.000/);
    await expect(personalizados.getByRole('row', { name: /70×100/ })).toContainText(/480\.000/);
    await expect(page.getByText('Otras ciudades')).toBeVisible();
    await expect(page.getByRole('img', { name: /sofá de 200 cm/ })).toBeVisible();
    expect(await graves(page)).toEqual([]);
  });

  test('/formatos usa los precios editados en el panel', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('arte-web:precios', JSON.stringify({ '13x18': { precio: 45000 } }));
    });
    await page.goto('/formatos');
    await expect(page.getByRole('row', { name: /13×18/ })).toContainText(/45\.000/);
  });
});

test.describe('catálogo y pared de la portada', () => {
  test('filtra por categoría, cuelga el póster a escala y lo agrega al pedido', async ({
    page,
  }) => {
    await irA(page, '/');
    const catalogo = page.locator('#catalogo');
    await catalogo.getByRole('button', { name: 'Motos', exact: true }).click();
    await expect(catalogo.getByRole('button', { name: /Ducati/ })).toBeVisible();
    await expect(catalogo.getByRole('button', { name: /Ferrari 488 Pista/ })).toBeHidden();

    await catalogo.getByRole('button', { name: 'Todos', exact: true }).click();
    await catalogo.getByRole('button', { name: /Ferrari 488 Pista/ }).click();
    const pared = page.locator('#pared');
    await expect(pared.getByText('Ferrari 488 Pista', { exact: true })).toBeVisible();
    // Los precios salen de negocio.ts: 35×50 con acrílico, $95.000; 50×70, $265.000.
    await expect(pared.getByText(/95\.000/).first()).toBeVisible();
    await pared.locator('input[name=vitrina-medida][value="50x70"]').check({ force: true });
    await expect(pared.getByText(/265\.000/).first()).toBeVisible();
    await expect(pared.locator('[data-cota=ancho]')).toHaveText('50 cm');
    await expect(pared.locator('[data-cota=alto]')).toHaveText('70 cm');

    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(pared.getByText(/Ferrari 488 Pista en 50×70 cm está en tu pedido/)).toBeVisible();
    await expect(page.getByTestId('contador-carrito')).toHaveText('1');

    await pared.getByRole('link', { name: 'Ver mi pedido' }).click();
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    await expect(page.getByTestId('total')).toHaveText(/265\.000/);
    const mensaje = page.getByTestId('mensaje');
    await expect(mensaje).toContainText('Diseño del catálogo: Ferrari 488 Pista');
    await expect(mensaje).not.toContainText('Adjunto');
  });

  test('un póster panorámico solo ofrece medidas panorámicas y se cuelga a lo ancho', async ({
    page,
  }) => {
    await irA(page, '/');
    await page
      .locator('#catalogo')
      .getByRole('button', { name: /Porsche 911 RSR/ })
      .first()
      .click();
    const pared = page.locator('#pared');
    await expect(pared.locator('input[name=vitrina-medida]')).toHaveCount(2);
    await expect(pared.locator('[data-cota=ancho]')).toHaveText('50 cm');
    await expect(pared.locator('[data-cota=alto]')).toHaveText('20 cm');
    await expect(pared.getByText(/78\.000/).first()).toBeVisible();
    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(pared.getByText(/Porsche 911 RSR en 50×20 cm está en tu pedido/)).toBeVisible();
  });

  test('un póster de la portada elige el diseño de la pared', async ({ page }) => {
    await irA(page, '/');
    // Con teclado se llega a cualquiera de la fila. Se reintenta porque la isla puede registrar
    // su escucha de clics un instante después de hidratarse.
    const pared = page.locator('#pared');
    await expect(async () => {
      await page.getByRole('link', { name: 'Ver McLaren 720S a escala' }).press('Enter');
      await expect(pared.getByText('McLaren 720S', { exact: true })).toBeVisible({ timeout: 1000 });
    }).toPass();
  });
});
