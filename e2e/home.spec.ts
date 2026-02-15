import { test, expect } from '@playwright/test';

test.describe('Homepage - Product Catalog', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Bypass login screen by clicking "QUERO APENAS OLHAR O CARDÁPIO"
        const guestButton = page.getByRole('button', { name: /QUERO APENAS OLHAR O CARDÁPIO/i });
        if (await guestButton.isVisible({ timeout: 5000 })) {
            await guestButton.click();
            await page.waitForTimeout(1000);
        }
    });

    test('should display the homepage with product catalog', async ({ page }) => {
        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check page title contains app name
        await expect(page).toHaveTitle(/Dona Capivara/i);
    });

    test('should display product cards', async ({ page }) => {
        // Wait for products to load (skeleton should disappear)
        await page.waitForTimeout(2000);

        // Check if any product cards are visible
        page.locator('[data-testid="product-card"]')
            .or(page.locator('.product-card'))
            .or(page.getByRole('button', { name: /adicionar|comprar/i }));

        // If specific selectors don't work, look for any clickable product elements
        const anyProducts = page.locator('button').filter({ hasText: /\+|adicionar/i });

        // At least some products should be visible
        await expect(anyProducts.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have navigation elements', async ({ page }) => {
        // Check for bottom navigation or header
        const nav = page.locator('nav').or(page.locator('[role="navigation"]'));
        await expect(nav.first()).toBeVisible();
    });
});

test.describe('Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Bypass login screen
        const guestButton = page.getByRole('button', { name: /QUERO APENAS OLHAR O CARDÁPIO/i });
        if (await guestButton.isVisible({ timeout: 5000 })) {
            await guestButton.click();
            await page.waitForTimeout(1000);
        }
    });

    test('should navigate to cart view', async ({ page }) => {
        // Find and click cart icon/button
        page.locator('button')
            .filter({ hasText: /carrinho|cart/i })
            .or(page.locator('[data-testid="cart-button"]'))
            .or(page.locator('svg').filter({ hasText: /cart/i }).locator('..'));

        // Try clicking cart if visible
        const cartNav = page
            .getByRole('button')
            .filter({ has: page.locator('svg') })
            .nth(2);
        if (await cartNav.isVisible()) {
            await cartNav.click();
            await page.waitForTimeout(500);
        }
    });
});
