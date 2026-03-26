import { test, expect } from '@playwright/test';

test.describe('My items smoke', () => {
  test('my-items page handles unauthenticated and empty states', async ({ page }) => {
    await page.goto('http://localhost:3000/my-items', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText();
    expect(
      /Для просмотра объявлений необходимо войти в систему/i.test(bodyText) ||
      /Мои объявления/i.test(bodyText) ||
      /У вас пока нет объявлений\./i.test(bodyText) ||
      /Не удалось загрузить данные\. Попробуйте обновить страницу\./i.test(bodyText)
    ).toBeTruthy();
  });
});

