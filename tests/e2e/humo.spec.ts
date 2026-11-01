import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('la página de inicio carga con marca, footer de demo y metadatos', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Áurea Estudio/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Demo · marca ficticia')).toBeVisible();
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_CO');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https?:\/\//,
  );
});

test('no hay scroll horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda).toBe(false);
});

test('axe no encuentra violaciones serias en /', async ({ page }) => {
  await page.goto('/');
  const { violations } = await new AxeBuilder({ page }).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => v.id)).toEqual([]);
});
