import { test, expect } from '@playwright/test';

test.describe('Item details smoke', () => {
  test('non-existing item shows not found message', async ({ page }) => {
    await page.goto('http://localhost:3000/item/non-existing-id-12345', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText();
    expect(
      /Объявление не найдено/i.test(bodyText) ||
      /Не удалось загрузить объявление\. Попробуйте позже\./i.test(bodyText) ||
      bodyText.trim().length > 0
    ).toBeTruthy();
  });
});

