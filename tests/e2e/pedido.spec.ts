import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

test.describe('pedido', () => {
  test('flujo completo: configurador, carrito, desglose, mensaje y registro', async ({ page }) => {
    await irA(page, '/crear');
    await page.locator('input[type=file]').setInputFiles('tests/fixtures/retrato-12mp.jpg');
    await expect(page.getByText('3024×4032 px')).toBeVisible();
    await page.locator('input[name=medida][value="30x40"]').check({ force: true });
    await page.getByRole('button', { name: 'Agregar uno' }).click();
    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('2');

    await page.getByRole('link', { name: 'Ver mi pedido' }).click();
    await expect(page).toHaveURL(/\/pedido/);
    await expect(page.getByRole('img', { name: 'Recorte de retrato-12mp.jpg' })).toBeVisible();
    await expect(page.getByText(/Agrega 1 más de 30×40 y pagas \$\s40\.000 c\/u/)).toBeVisible();
    await expect(page.getByTestId('total')).toHaveText(/120\.000/);

    await page.getByRole('button', { name: 'Agregar uno de 30×40' }).click();
    await expect(page.getByTestId('total')).toHaveText(/120\.000/);
    await expect(page.getByText(/Descuento 30×40/)).toBeVisible();
    await expect(page.getByTestId('abono')).toHaveText(/60\.000/);
    await expect(page.getByText(/Agrega 1 más de 30×40/)).toHaveCount(0);

    await page.getByLabel('Nombre').fill('Sofía Peña');
    await page.getByLabel('Ciudad').fill('Bucaramanga');
    await page.getByLabel('Celular').fill('3001234567');
    await page.getByLabel(/Nota para el taller/).fill('Para regalo & con tarjeta');

    const mensaje = page.getByTestId('mensaje');
    await expect(mensaje).toContainText('Pedido: AE-1043');
    await expect(mensaje).toContainText('30×40 vertical · MDF · x3');
    await expect(mensaje).toContainText('Sofía Peña');
    await expect(mensaje).toContainText('Adjunto mis fotos en este chat');
    await expect(
      page.getByText(/En la versión real esto abre el WhatsApp del taller/),
    ).toBeVisible();

    const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => v.id)).toEqual([]);

    await page.getByRole('button', { name: 'Pedir por WhatsApp' }).click();
    await expect(
      page.getByRole('heading', { name: 'Tu pedido AE-1043 quedó registrado' }),
    ).toBeVisible();
    await expect(page.getByTestId('contador-carrito')).toHaveCount(0);

    const guardado = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('arte-web:pedidos') ?? '[]').find(
        (p: { numero: string }) => p.numero === 'AE-1043',
      ),
    );
    expect(guardado).toMatchObject({
      estado: 'recibido',
      total: 120000,
      cliente: { nombre: 'Sofía Peña', ciudad: 'Bucaramanga' },
    });

    await page.getByRole('link', { name: 'Ver el seguimiento' }).click();
    await expect(page).toHaveURL(/seguimiento\?numero=AE-1043/);
  });

  test('pide los datos obligatorios antes de registrar', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'arte-web:carrito',
        JSON.stringify([
          {
            id: 'a',
            medidaId: '45x60',
            orientacion: 'vertical',
            material: 'mdf',
            cantidad: 1,
            recorte: { x: 0, y: 0, width: 100, height: 100 },
            archivo: 'foto.jpg',
            dimensiones: { ancho: 3024, alto: 4032 },
            dpi: 171,
            calidad: 'buena',
          },
        ]),
      );
    });
    await irA(page, '/pedido');
    await expect(page.getByText(/Agrega 1 más de 45×60 y llevas 2 por \$\s130\.000/)).toBeVisible();
    await expect(page.getByText(/vistas previas se perdieron/)).toBeVisible();
    await page.getByRole('button', { name: 'Pedir por WhatsApp' }).click();
    await expect(page.getByRole('heading', { name: /quedó registrado/ })).toHaveCount(0);
    expect(
      await page.getByLabel('Nombre').evaluate((e: HTMLInputElement) => e.validity.valid),
    ).toBe(false);
  });

  test('con el carrito vacío invita a crear un cuadro', async ({ page }) => {
    await irA(page, '/pedido');
    await expect(page.getByText('Tu pedido está vacío.')).toBeVisible();
  });
});

test('un carrito de una versión vieja no tumba /pedido', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'arte-web:carrito',
      JSON.stringify([{ id: 'viejo', medidaId: '999x999', cantidad: 1 }, 'basura']),
    );
  });
  await irA(page, '/pedido');
  await expect(page.getByText('Tu pedido está vacío.')).toBeVisible();
});

test('un pedido dañado no tumba el panel ni el seguimiento', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'arte-web:pedidos',
      JSON.stringify([
        { numero: 'AE-1050', total: 60000, estado: 'listo', cliente: { nombre: 'Ana' } },
        { numero: 'AE-1051' },
      ]),
    );
  });
  await irA(page, '/taller');
  await expect(page.getByRole('button', { name: /AE-1050/ })).toBeVisible();
  await irA(page, '/seguimiento?numero=AE-1050');
  await expect(page.getByRole('heading', { name: 'Pedido AE-1050' })).toBeVisible();
});
