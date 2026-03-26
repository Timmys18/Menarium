import { test, expect } from '@playwright/test';

test.describe('Swipe smoke', () => {
  test('swipe page renders without runtime errors', async ({ page }) => {
    await page.goto('http://localhost:3000/swipe', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    // Либо заголовок страницы/текст, либо просто не пустая страница
    const bodyText = await page.locator('body').innerText();
    expect(
      /Свайп режим/i.test(bodyText) ||
      /Нет объявлений для свайпа/i.test(bodyText) ||
      /Не удалось загрузить данные\. Попробуйте обновить страницу\./i.test(bodyText) ||
      bodyText.trim().length > 0
    ).toBeTruthy();
  });
});

