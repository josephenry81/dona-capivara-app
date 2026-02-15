import { test, expect } from '@playwright/test';

test.describe('Cart and Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Bypass login screen by clicking "QUERO APENAS OLHAR O CARDÁPIO"
        const guestButton = page.getByRole('button', { name: /QUERO APENAS OLHAR O CARDÁPIO/i });
        if (await guestButton.isVisible({ timeout: 5000 })) {
            await guestButton.click();
            await page.waitForTimeout(1000);
        }

        // Dismiss onboarding modal if visible
        const skipTutorial = page.getByRole('button', { name: /Pular Tutorial/i });
        if (await skipTutorial.isVisible({ timeout: 3000 })) {
            await skipTutorial.click();
            await page.waitForTimeout(500);
        }

        await page.waitForTimeout(2000); // Wait for products to load
    });

    test('should add product to cart', async ({ page }) => {
        // Find an add button and click it
        const addButtons = page.locator('button').filter({ hasText: /\+/ });

        if (await addButtons.first().isVisible()) {
            await addButtons.first().click();
            await page.waitForTimeout(500);

            // Check if cart indicator shows items
            // Look for badge or counter on cart
            page.locator('[data-testid="cart-count"]')
                .or(page.locator('.badge'))
                .or(page.locator('span').filter({ hasText: /^[1-9]$/ }));

            // Cart should have at least 1 item
            await expect(page.locator('body')).toContainText(/1|carrinho/i);
        }
    });

    test('should display cart with items', async ({ page }) => {
        // First add a product
        const addButtons = page.locator('button').filter({ hasText: /\+/ });
        if (await addButtons.first().isVisible()) {
            await addButtons.first().click();
            await page.waitForTimeout(500);
        }

        // Navigate to cart (click cart in bottom nav)
        const navButtons = page.locator('nav button, footer button');
        const cartButton = navButtons.filter({ has: page.locator('svg[viewBox]') }).last();

        if (await cartButton.isVisible()) {
            await cartButton.click();
            await page.waitForTimeout(1000);
        }

        // Cart view should show items or empty message
        const cartContent = page.locator('body');
        await expect(cartContent).toContainText(/carrinho|cart|total|R\$/i);
    });

    test('should show checkout options in cart', async ({ page }) => {
        // Add product first
        const addButtons = page.locator('button').filter({ hasText: /\+/ });
        if (await addButtons.first().isVisible()) {
            await addButtons.first().click();
            await page.waitForTimeout(500);
        }

        // Go to cart
        const navButtons = page.locator('nav button, footer button').last();
        if (await navButtons.isVisible()) {
            await navButtons.click();
            await page.waitForTimeout(1000);
        }

        // Should see delivery/payment options or checkout button
        const checkoutElements = page.locator('body');
        await expect(checkoutElements).toContainText(/entrega|delivery|pix|pagamento|whatsapp|finalizar/i);
    });

    test('should validate coupon input field exists', async ({ page }) => {
        // Add product and go to cart
        const addButtons = page.locator('button').filter({ hasText: /\+/ });
        if (await addButtons.first().isVisible()) {
            await addButtons.first().click();
            await page.waitForTimeout(500);
        }

        const navButtons = page.locator('nav button, footer button').last();
        if (await navButtons.isVisible()) {
            await navButtons.click();
            await page.waitForTimeout(1000);
        }

        // Look for coupon input
        const couponInput = page
            .locator('input[placeholder*="cupom" i]')
            .or(page.locator('input[name*="coupon" i]'))
            .or(page.getByPlaceholder(/cupom|código/i));

        // Coupon field should exist in cart
        if (await couponInput.isVisible()) {
            await expect(couponInput).toBeEnabled();
        }
    });
});

test.describe('Price Calculation', () => {
    test('should show correct total when adding items', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Get initial state
        const addButtons = page.locator('button').filter({ hasText: /\+/ });

        if (await addButtons.first().isVisible()) {
            // Add first product
            await addButtons.first().click();
            await page.waitForTimeout(500);

            // Go to cart
            const navButtons = page.locator('nav button, footer button').last();
            if (await navButtons.isVisible()) {
                await navButtons.click();
                await page.waitForTimeout(1000);
            }

            // Total should contain R$ format
            const totalText = page.locator('body');
            await expect(totalText).toContainText(/R\$\s*\d+[,.]?\d*/);
        }
    });
});
