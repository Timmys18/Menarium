import { test, expect } from '@playwright/test';

test.describe('Catalog smoke', () => {
  test('catalog page is not empty and handles empty DB', async ({ page }) => {
    await page.goto('http://localhost:3000/catalog', { waitUntil: 'domcontentloaded' });

    // Проверяем, что основной контент каталога отрендерился (контейнер main)
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 15000 });

    // Либо пустое состояние, либо хотя бы одна карточка
    const emptyState = page.getByText('Пока нет объявлений');
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    const itemCards = page.locator('a[href^="/item/"]');
    const cardCount = await itemCards.count();

    expect(emptyVisible || cardCount > 0).toBeTruthy();
  });
});

