import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Auth login smoke', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto(`${baseURL}/auth/login`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/Вход в аккаунт/i)).toBeVisible({ timeout: 15000 });

    const firstInput = page.locator('input').first();
    await expect(firstInput).toBeVisible({ timeout: 15000 });
  });
});

