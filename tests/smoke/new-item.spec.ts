import { test, expect } from '@playwright/test';

test.describe('New item smoke', () => {
  test('new item page renders form', async ({ page }) => {
    await page.goto('http://localhost:3000/new', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    // Проверяем заголовок формы создания объявления
    await expect(page.getByRole('heading', { name: /Создать объявление/i })).toBeVisible({ timeout: 15000 });
  });
});

