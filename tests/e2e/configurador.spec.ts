import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const fixture = (nombre: string) => `tests/fixtures/${nombre}`;

test.describe('configurador', () => {
  test('sube, recorta, elige medida, ve el aviso y agrega al pedido', async ({ page }) => {
    await page.goto('/crear');
    await page.locator('input[type=file]').setInputFiles(fixture('retrato-12mp.jpg'));
    await expect(page.getByText('3024×4032 px')).toBeVisible();

    await page.locator('input[name=medida][value="30x40"]').check({ force: true });
    await expect(page.getByText(/Calidad buena.*para 30×40 \(256 dpi\)/)).toBeVisible();
    await expect(
      page.getByText(/La medida más grande con calidad buena para esta foto es\s*45×60/),
    ).toBeVisible();
    await expect(page.getByTestId('precio')).toHaveText(/60\.000/);

    await page.getByRole('button', { name: 'Agregar uno' }).click();
    await expect(page.getByTestId('precio')).toHaveText(/120\.000/);
    await expect(page.getByText(/Agrega 1 más de 30×40 y pagas \$\s40\.000 c\/u/)).toBeVisible();

    await page.locator('input[name=material][value="acrilico"]').check({ force: true });
    await expect(page.getByRole('img', { name: /30×40 en acrílico/ })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(page.getByRole('status')).toContainText('Agregaste 2 cuadros de 30×40');

    const carrito = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('arte-web:carrito') ?? '[]'),
    );
    expect(carrito).toHaveLength(1);
    expect(carrito[0]).toMatchObject({
      medidaId: '30x40',
      orientacion: 'vertical',
      material: 'acrilico',
      cantidad: 2,
      archivo: 'retrato-12mp.jpg',
      dimensiones: { ancho: 3024, alto: 4032 },
      dpi: 256,
      calidad: 'buena',
    });
    expect(carrito[0].recorte.width).toBeGreaterThan(99);

    const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => v.id)).toEqual([]);
  });

  test('pequena.jpg en 60×80 da calidad baja', async ({ page }) => {
    await page.goto('/crear');
    await page.locator('input[type=file]').setInputFiles(fixture('pequena.jpg'));
    await page.locator('input[name=medida][value="60x80"]').check({ force: true });
    await expect(page.getByText(/Calidad baja/)).toBeVisible();
    await expect(
      page.getByText('Esta foto no alcanza calidad buena en ninguna medida.'),
    ).toBeVisible();
  });

  test('un HEIC que el navegador no abre muestra cómo cambiar el formato', async ({ page }) => {
    await page.goto('/crear');
    await page.locator('input[type=file]').setInputFiles(fixture('falso.heic'));
    await expect(page.getByRole('alert')).toContainText('Tu foto está en formato HEIC');
  });

  test('rechaza un PDF', async ({ page }) => {
    await page.goto('/crear');
    await page.locator('input[type=file]').setInputFiles(fixture('documento.pdf'));
    await expect(page.getByRole('alert')).toContainText('Sube una foto JPG, PNG o WebP');
  });
});
