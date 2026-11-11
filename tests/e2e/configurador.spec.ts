import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

const fixture = (nombre: string) => `tests/fixtures/${nombre}`;

test.describe('póster personalizado', () => {
  test('describe el vehículo, ve el boceto y el precio, y lo agrega al pedido', async ({
    page,
  }) => {
    await irA(page, '/crear');
    await page.getByLabel('Marca y modelo').fill('Mazda 3 Touring');
    await page.getByLabel('Año').fill('2019');
    await page.getByLabel('Color').fill('Rojo');
    await page.getByLabel('Detalles que no pueden faltar').fill('Rines negros');
    await expect(
      page.getByRole('img', { name: 'Boceto del póster de Mazda 3 Touring' }),
    ).toContainText('Mazda');

    // 35×50 con acrílico es la medida de entrada: $105.000 y abono de la mitad.
    await expect(page.getByTestId('precio-encargo')).toHaveText(/105\.000/);
    await expect(page.getByText(/Empiezas con \$\s52\.500/)).toBeVisible();
    await page.locator('label:has(input[name=encargo-medida][value="p-50x70"])').click();
    await expect(page.getByTestId('precio-encargo')).toHaveText(/270\.000/);

    await page.getByTestId('fotos-referencia').setInputFiles(fixture('retrato-12mp.jpg'));
    await expect(page.getByRole('img', { name: 'retrato-12mp.jpg' })).toBeVisible();

    const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);

    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(
      page.getByText(/Mazda 3 Touring 2019 en 50×70 cm está en tu pedido/),
    ).toBeVisible();
    await expect(page.getByTestId('contador-carrito')).toHaveText('1');

    const carrito = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('arte-web:carrito') ?? '[]'),
    );
    expect(carrito).toHaveLength(1);
    expect(carrito[0]).toMatchObject({
      medidaId: 'p-50x70',
      orientacion: 'vertical',
      material: 'vidrio',
      cantidad: 1,
      archivo: 'Mazda 3 Touring 2019',
      encargo: { vehiculo: 'Carro: Mazda 3 Touring 2019', fotos: 1 },
    });
    expect(carrito[0].encargo.detalles).toContain('color Rojo');
    expect(carrito[0].encargo.detalles).toContain('Rines negros');
  });

  test('el estilo panorámico cambia las medidas y el boceto', async ({ page }) => {
    await irA(page, '/crear');
    await page.locator('input[name=encargo-tipo][value="moto"]').check({ force: true });
    await page.getByLabel('Marca y modelo').fill('Yamaha MT-09');
    await page.locator('input[name=encargo-estilo][value="panoramico"]').check({ force: true });
    await expect(page.locator('input[name=encargo-medida]')).toHaveCount(1);
    await expect(page.getByTestId('precio-encargo')).toHaveText(/85\.000/);
    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(page.getByText(/Yamaha MT-09 en 50×20 cm está en tu pedido/)).toBeVisible();
    const item = await page.evaluate(
      () => JSON.parse(localStorage.getItem('arte-web:carrito') ?? '[]')[0],
    );
    expect(item).toMatchObject({
      medidaId: 'p-20x50',
      orientacion: 'horizontal',
      encargo: { vehiculo: 'Moto: Yamaha MT-09' },
    });
  });

  test('sin marca y modelo no agrega nada y dice qué falta', async ({ page }) => {
    await irA(page, '/crear');
    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(
      page.getByText('Escribe la marca y el modelo para saber qué ilustrar.'),
    ).toBeVisible();
    await expect(page.getByLabel('Marca y modelo')).toBeFocused();
    await expect(page.getByTestId('contador-carrito')).toHaveCount(0);
  });

  test('rechaza un PDF como foto de referencia', async ({ page }) => {
    await irA(page, '/crear');
    await page.getByTestId('fotos-referencia').setInputFiles(fixture('documento.pdf'));
    await expect(page.getByText(/documento\.pdf:/)).toBeVisible();
    await expect(page.getByRole('list', { name: 'Fotos elegidas' }).getByRole('img')).toHaveCount(
      0,
    );
  });
});
