import { test, expect } from '@playwright/test';

test.describe('Home smoke', () => {
  test('home page renders basic UI', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Проверяем наличие ссылки "Каталог" в навигации
    const catalogLink = page.getByRole('link', { name: /каталог/i });
    await expect(catalogLink).toBeVisible({ timeout: 15000 });
  });
});

