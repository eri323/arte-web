import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { irA } from './utilidades';

async function sinViolacionesGraves(page: Page) {
  const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(graves.map((v) => v.id)).toEqual([]);
}

test.describe('seguimiento', () => {
  test('muestra el pedido demo RT-1041 con saldo pendiente', async ({ page }) => {
    await irA(page, '/seguimiento');
    await page.getByLabel('Número de pedido').fill('rt-1041');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('heading', { name: 'Pedido RT-1041' })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toContainText(
      'Listo, falta pagar el saldo',
    );
    await expect(page.getByTestId('saldo')).toHaveText(/95\.000/);
    await expect(page.getByText(/Fecha estimada/)).toBeVisible();
    await expect(page).toHaveURL(/numero=RT-1041/);
    await sinViolacionesGraves(page);
  });

  test('RT-1042 muestra la guía y RT-1040 la nota', async ({ page }) => {
    await irA(page, '/seguimiento?numero=RT-1042');
    await expect(page.getByText('7001234567')).toBeVisible();
    await irA(page, '/seguimiento?numero=RT-1040');
    await expect(
      page.getByText('Tu diseño está aprobado: mañana entra a impresión y enmarcado'),
    ).toBeVisible();
  });

  test('avisa si el número no existe', async ({ page }) => {
    await irA(page, '/seguimiento?numero=RT-9999');
    await expect(page.getByText(/No encontramos el pedido RT-9999/)).toBeVisible();
  });
});

test.describe('panel del taller', () => {
  test('cambiar el estado y agregar una nota se ve en el seguimiento', async ({ page }) => {
    await irA(page, '/taller');
    await expect(page.getByText('Panel demo sin login.')).toBeVisible();
    await page.getByRole('button', { name: /RT-1040/ }).click();
    await page.getByRole('button', { name: 'Pasar a: Listo, falta pagar el saldo' }).click();
    await expect(
      page.getByRole('button', { name: /RT-1040.*Listo, falta pagar el saldo/ }),
    ).toBeVisible();

    await page.getByLabel('Nota para el cliente').fill('Ya está listo, ¡quedó hermoso!');
    await page.getByRole('button', { name: 'Agregar nota' }).click();
    await expect(page.getByText(/Ya está listo, ¡quedó hermoso!/)).toBeVisible();
    await sinViolacionesGraves(page);

    await irA(page, '/seguimiento?numero=RT-1040');
    await expect(page.locator('[aria-current="step"]')).toContainText(
      'Listo, falta pagar el saldo',
    );
    await expect(page.getByText('Ya está listo, ¡quedó hermoso!')).toBeVisible();
  });

  test('cobra el saldo y envía con guía en un toque cada uno', async ({ page }) => {
    await irA(page, '/taller');
    await page.getByRole('button', { name: /RT-1041/ }).click();
    await page
      .getByRole('button', { name: /Registrar saldo de \$\s95\.000 y marcar pagado/ })
      .click();
    await expect(page.getByRole('button', { name: 'Pasar a: Enviado' })).toBeDisabled();
    await page.getByLabel('Transportadora').fill('Envíos Demo');
    await page.getByLabel('Número de guía').fill('ABC123');
    await page.getByRole('button', { name: 'Pasar a: Enviado' }).click();
    await irA(page, '/seguimiento?numero=RT-1041');
    await expect(page.getByTestId('saldo')).toHaveText(/\$\s0/);
    await expect(page.getByText('ABC123')).toBeVisible();
  });

  test('editar un precio se refleja en /formatos y restaurar lo devuelve', async ({ page }) => {
    await irA(page, '/taller');
    await page.getByLabel('Precio 13×18', { exact: true }).fill('45000');
    await page.getByRole('button', { name: 'Guardar 13×18', exact: true }).click();
    await irA(page, '/formatos');
    await expect(page.getByRole('row', { name: /13×18/ })).toContainText(/45\.000/);

    await irA(page, '/taller');
    await page.getByRole('button', { name: 'Restaurar datos de ejemplo' }).click();
    await page.getByRole('button', { name: 'Toca otra vez para confirmar' }).click();
    await irA(page, '/formatos');
    await expect(page.getByRole('row', { name: /13×18/ })).toContainText(/42\.000/);
  });
});
