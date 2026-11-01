import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { irA } from './utilidades';

const paginas = ['/', '/formatos', '/crear', '/pedido', '/seguimiento', '/taller'];

for (const ruta of paginas) {
  test.describe(`página ${ruta}`, () => {
    test('axe sin violaciones serias ni críticas', async ({ page }) => {
      await irA(page, ruta);
      const graves = (await new AxeBuilder({ page }).analyze()).violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(graves.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
    });

    test('sin scroll horizontal a 375 px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await irA(page, ruta);
      const desborda = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(desborda).toBe(false);
    });

    test('SEO y Open Graph completos, con imagen existente', async ({ page, request }) => {
      await irA(page, ruta);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        /Áurea Estudio/,
      );
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /.+/,
      );
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_CO');
      const og = await page.locator('meta[property="og:image"]').getAttribute('content');
      const respuesta = await request.get(new URL(og ?? '').pathname);
      expect(respuesta.status()).toBe(200);
      expect(respuesta.headers()['content-type']).toContain('image/png');
    });

    test('el footer dice que es una demo', async ({ page }) => {
      await irA(page, ruta);
      await expect(page.getByText('Demo · marca ficticia')).toBeVisible();
    });
  });
}
