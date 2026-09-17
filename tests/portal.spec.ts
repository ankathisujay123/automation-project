import { test, expect } from '@playwright/test';

const portalUrl = process.env.PORTAL_URL || 'https://example.com';
const portalUsername = process.env.PORTAL_USERNAME || '';
const portalPassword = process.env.PORTAL_PASSWORD || '';

test('portal smoke automation', async ({ page }) => {
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveTitle(/.+/);

  if (portalUsername && portalPassword) {
    const emailField = page.locator(
      'input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="username" i], input[placeholder*="email" i]'
    ).first();

    const passwordField = page.locator(
      'input[type="password"], input[name*="password" i], input[id*="password" i]'
    ).first();

    if (await emailField.count()) {
      await emailField.fill(portalUsername);
    }

    if (await passwordField.count()) {
      await passwordField.fill(portalPassword);
    }

    const submitButton = page
      .locator('button:has-text("Login"), button:has-text("Sign in"), input[type="submit"], button[type="submit"]')
      .first();

    if (await submitButton.count()) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');
    }
  }

  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({ path: 'test-results/portal-smoke.png', fullPage: true });

  console.log(`Portal tested: ${portalUrl}`);
  if (!portalUsername || !portalPassword) {
    console.log('No portal credentials were provided. Update PORTAL_URL, PORTAL_USERNAME, and PORTAL_PASSWORD to log in automatically.');
  }
});
