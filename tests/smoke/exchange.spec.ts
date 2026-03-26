import { test, expect } from '@playwright/test';

test.describe('Exchange smoke', () => {
  test('exchange page renders without runtime errors', async ({ page }) => {
    await page.goto('http://localhost:3000/exchange', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    // Заголовок страницы обменов
    await expect(page.getByText(/Мои обмены/i)).toBeVisible({ timeout: 15000 });
  });
});

