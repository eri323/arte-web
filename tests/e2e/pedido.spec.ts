import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

const item = (extra: Record<string, unknown>) => ({
  orientacion: 'vertical',
  cantidad: 1,
  recorte: { x: 0, y: 0, width: 100, height: 100 },
  dimensiones: { ancho: 4134, alto: 5906 },
  dpi: 300,
  calidad: 'buena',
  ...extra,
});

test.describe('pedido', () => {
  test('flujo completo: catálogo y personalizado, desglose, mensaje y registro', async ({
    page,
  }) => {
    await irA(page, '/');
    const pared = page.locator('#pared');
    await page
      .locator('#catalogo')
      .getByRole('button', { name: /Ferrari 488 Pista/ })
      .click();
    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('1');

    await irA(page, '/crear');
    await page.getByLabel('Marca y modelo').fill('Mazda 3 Touring');
    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('2');
    await page.getByRole('link', { name: 'Ver mi pedido' }).click();
    await expect(page).toHaveURL(/\/pedido/);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);

    // 35×50 con acrílico: $95.000 del catálogo + $105.000 del personalizado.
    await expect(page.getByTestId('total')).toHaveText(/200\.000/);
    await expect(page.getByTestId('abono')).toHaveText(/100\.000/);
    await page.getByRole('button', { name: 'Agregar uno de 35×50 · acrílico' }).click();
    await expect(page.getByTestId('total')).toHaveText(/295\.000/);
    await expect(page.getByTestId('abono')).toHaveText(/147\.500/);

    await page.getByLabel('Nombre').fill('Sofía Peña');
    await page.getByLabel('Ciudad').fill('Bucaramanga');
    await page.getByLabel('Celular').fill('3001234567');
    await page.getByLabel(/Nota para el taller/).fill('Para regalo & con tarjeta');

    const mensaje = page.getByTestId('mensaje');
    await expect(mensaje).toContainText('Pedido: RT-1043');
    await expect(mensaje).toContainText('35×50 vertical · Acrílico · x2');
    await expect(mensaje).toContainText('Diseño del catálogo: Ferrari 488 Pista');
    await expect(mensaje).toContainText('Personalizado: Carro: Mazda 3 Touring');
    await expect(mensaje).toContainText('Sofía Peña');
    await expect(mensaje).toContainText('Adjunto las fotos de referencia de mi vehículo');

    const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => v.id)).toEqual([]);

    // El botón abre el chat del taller en otra pestaña; la prueba no llega a WhatsApp de verdad.
    await page.context().route(/wa\.me|whatsapp\.com/, (ruta) => ruta.abort());
    await page.getByRole('button', { name: 'Pedir por WhatsApp' }).click();
    await expect(page.getByRole('link', { name: '¿No se abrió? Abrir WhatsApp' })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/573026423318\?text=/,
    );
    await expect(
      page.getByRole('heading', { name: 'Tu pedido RT-1043 quedó registrado' }),
    ).toBeVisible();
    await expect(page.getByTestId('contador-carrito')).toHaveCount(0);

    const guardado = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('arte-web:pedidos') ?? '[]').find(
        (p: { numero: string }) => p.numero === 'RT-1043',
      ),
    );
    expect(guardado).toMatchObject({
      estado: 'recibido',
      total: 295000,
      cliente: { nombre: 'Sofía Peña', ciudad: 'Bucaramanga' },
    });
    expect(guardado.items[1].encargo.vehiculo).toBe('Carro: Mazda 3 Touring');

    await page.getByRole('link', { name: 'Ver el seguimiento' }).click();
    await expect(page).toHaveURL(/seguimiento\?numero=RT-1043/);
  });

  test('pide los datos obligatorios antes de registrar', async ({ page }) => {
    await page.addInitScript(
      (it) => {
        localStorage.setItem('arte-web:carrito', JSON.stringify([it]));
      },
      item({
        id: 'a',
        medidaId: '50x70',
        material: 'vidrio',
        archivo: 'Nürburgring Nordschleife',
        disenoId: 'nordschleife',
      }),
    );
    await irA(page, '/pedido');
    await expect(page.getByTestId('total')).toHaveText(/265\.000/);
    await page.getByRole('button', { name: 'Pedir por WhatsApp' }).click();
    await expect(page.getByRole('heading', { name: /quedó registrado/ })).toHaveCount(0);
    expect(
      await page.getByLabel('Nombre').evaluate((e: HTMLInputElement) => e.validity.valid),
    ).toBe(false);
  });

  test('con el carrito vacío invita a ver el catálogo', async ({ page }) => {
    await irA(page, '/pedido');
    await expect(page.getByText('Tu pedido está vacío.')).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Ver el catálogo' }),
    ).toBeVisible();
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
        { numero: 'RT-1050', total: 60000, estado: 'listo', cliente: { nombre: 'Ana' } },
        { numero: 'RT-1051' },
      ]),
    );
  });
  await irA(page, '/taller');
  await expect(page.getByRole('button', { name: /RT-1050/ })).toBeVisible();
  await irA(page, '/seguimiento?numero=RT-1050');
  await expect(page.getByRole('heading', { name: 'Pedido RT-1050' })).toBeVisible();
});
