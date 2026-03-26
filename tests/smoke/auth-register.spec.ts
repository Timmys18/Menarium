import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Auth register smoke', () => {
  test('register page renders form', async ({ page }) => {
    await page.goto(`${baseURL}/auth/register`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/Регистрация/i)).toBeVisible({ timeout: 15000 });

    const firstInput = page.locator('input').first();
    await expect(firstInput).toBeVisible({ timeout: 15000 });
  });
});

