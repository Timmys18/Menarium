import { test, expect } from '@playwright/test';

test.describe('Profile smoke', () => {
  test('profile page shows auth or profile UI', async ({ page }) => {
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText();
    expect(
      /Необходима авторизация/i.test(bodyText) ||
      /Вход в аккаунт/i.test(bodyText) ||
      /Мои объявления/i.test(bodyText)
    ).toBeTruthy();
  });
});

