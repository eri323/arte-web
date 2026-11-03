import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

const graves = async (page: import('@playwright/test').Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);

test.describe('páginas de contenido', () => {
  test('la portada tiene el catálogo, los pasos, pagos y preguntas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Así nace tu cuadro' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lo fabricamos' })).toBeVisible();
    const escalera = page.locator('#catalogo').getByRole('list', { name: 'Diseños de referencia' });
    await expect(escalera).toBeVisible();
    await expect(
      page.locator('#catalogo').getByRole('heading', { name: 'A mis 20' }),
    ).toBeVisible();
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

test.describe('catálogo y pared de la portada', () => {
  test('filtra por categoría, cuelga el diseño y lo agrega al pedido', async ({ page }) => {
    await irA(page, '/');
    const catalogo = page.locator('#catalogo');
    await catalogo.getByRole('button', { name: 'Cine', exact: true }).click();
    await expect(catalogo.getByRole('heading', { name: 'El mundo es tuyo' })).toBeVisible();
    await expect(catalogo.getByRole('heading', { name: 'A mis 20' })).toBeHidden();
    await catalogo.getByRole('button', { name: 'Siguiente diseño' }).click();
    await expect(catalogo.getByRole('heading', { name: 'Fight Club' })).toBeVisible();

    await catalogo.getByRole('button', { name: 'Ver en mi pared: Fight Club' }).click();
    const pared = page.locator('#pared');
    await expect(pared.getByText('Fight Club', { exact: true })).toBeVisible();
    // El precio sale de negocio.ts: 45×60 cuesta $80.000 y 60×80, $130.000.
    await expect(pared.getByText(/80\.000/).first()).toBeVisible();
    await pared.getByText('60×80', { exact: true }).click();
    await expect(pared.getByText(/130\.000/).first()).toBeVisible();
    await pared.getByText('Acrílico', { exact: true }).click();

    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(
      pared.getByText(/Fight Club en 60×80 cm, Acrílico está en tu pedido/),
    ).toBeVisible();
    await expect(page.getByTestId('contador-carrito')).toHaveText('1');

    await pared.getByRole('link', { name: 'Ver mi pedido' }).click();
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    await expect(page.getByText('Diseño del catálogo: Fight Club').first()).toBeVisible();
    const mensaje = page.getByTestId('mensaje');
    await expect(mensaje).toContainText('Diseño del catálogo: Fight Club');
    await expect(mensaje).not.toContainText('Adjunto mis fotos');
  });

  test('la pared gira el cuadro a horizontal y así va al pedido', async ({ page }) => {
    await irA(page, '/');
    const catalogo = page.locator('#catalogo');
    await catalogo.getByRole('button', { name: 'Música', exact: true }).click();
    await catalogo.getByRole('button', { name: 'Ver en mi pared: A mis 20' }).click();
    const pared = page.locator('#pared');
    await pared.getByText('Horizontal', { exact: true }).click();
    await expect(pared.getByText(/recorte de referencia/)).toBeVisible();
    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(
      pared.getByText(/A mis 20 en 60×45 cm, horizontal, MDF está en tu pedido/),
    ).toBeVisible();
  });

  test('una foto horizontal del taller se muestra horizontal en la pared', async ({ page }) => {
    await irA(page, '/');
    const catalogo = page.locator('#catalogo');
    await catalogo.getByRole('button', { name: 'Deportes', exact: true }).click();
    await catalogo.getByRole('button', { name: 'Ver en mi pared: La chilena' }).click();
    const pared = page.locator('#pared');
    await expect(pared.getByRole('img', { name: /futbolista haciendo una chilena/ })).toBeVisible();
    await pared.getByRole('button', { name: 'Agregar al pedido' }).click();
    await expect(pared.getByText(/La chilena en 60×45 cm, horizontal, MDF/)).toBeVisible();
  });

  test('la imagen que sube el cliente queda colgada en la pared', async ({ page }) => {
    await irA(page, '/');
    await page.getByTestId('subir-imagen').setInputFiles('tests/fixtures/pequena.jpg');
    const pared = page.locator('#pared');
    await expect(pared.getByRole('img', { name: 'Tu imagen colgada en la pared' })).toBeVisible();
    await expect(pared.getByText('Personalizado', { exact: true })).toBeVisible();
    await expect(pared.getByRole('link', { name: 'Seguir con mi foto' })).toHaveAttribute(
      'href',
      /^\/crear\?medida=45x60&orientacion=vertical&material=mdf$/,
    );
    await pared.getByRole('button', { name: 'Volver a los diseños' }).click();
    await expect(pared.getByRole('button', { name: 'Agregar al pedido' })).toBeVisible();
  });

  test('«Seguir con mi foto» lleva la foto y las opciones de la pared a /crear', async ({
    page,
  }) => {
    await irA(page, '/');
    await page.getByTestId('subir-imagen').setInputFiles('tests/fixtures/retrato-12mp.jpg');
    const pared = page.locator('#pared');
    await expect(pared.getByRole('img', { name: 'Tu imagen colgada en la pared' })).toBeVisible();
    // Se toca la opción como lo haría el cliente (el radio real es invisible).
    await pared.getByText('Acrílico', { exact: true }).click();
    await pared.getByText('Horizontal', { exact: true }).click();
    await pared.getByRole('link', { name: 'Seguir con mi foto' }).click();

    await expect(page).toHaveURL(/\/crear\?/);
    // La foto llega sola: no hay que subirla otra vez.
    await expect(page.getByText('3024×4032 px')).toBeVisible();
    await expect(page.locator('input[name=medida][value="45x60"]')).toBeChecked();
    await expect(page.locator('input[name=orientacion][value="horizontal"]')).toBeChecked();
    await expect(page.locator('input[name=material][value="acrilico"]')).toBeChecked();

    // Se toma una sola vez: al recargar ya no aparece.
    await page.reload();
    await expect(page.getByText('Sube tu foto')).toBeVisible();
  });

  test('un cuadro del abanico de la portada elige el diseño de la pared', async ({ page }) => {
    await irA(page, '/');
    // Las cartas se montan unas sobre otras; con teclado se llega a cualquiera. En el celular las
    // de las puntas se ocultan, por eso se usa una del centro. Se reintenta porque la isla puede
    // registrar su escucha de clics un instante después de hidratarse.
    const pared = page.locator('#pared');
    await expect(async () => {
      await page.getByRole('link', { name: 'Ver Estatua pop en mi pared' }).press('Enter');
      await expect(pared.getByText('Estatua pop', { exact: true })).toBeVisible({ timeout: 1000 });
    }).toPass();
  });
});
