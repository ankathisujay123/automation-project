import { test, expect, Page } from '@playwright/test';

const baseUrl = 'https://www.saucedemo.com/';
const validUser = { username: 'standard_user', password: 'secret_sauce' };
const lockedUser = { username: 'locked_out_user', password: 'secret_sauce' };

const parseCurrency = (value: string) => Number(value.replace(/[^0-9.-]+/g, ''));

async function login(page: Page, username: string, password: string) {
  await page.goto(baseUrl);
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();
}

async function addProducts(page: Page, productNames: string[]) {
  for (const productName of productNames) {
    const productButton = page.locator('[data-test="inventory-item"]').filter({ hasText: productName }).locator('button');
    await productButton.click();
  }
}

test.describe('Sauce Demo automation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('valid login succeeds', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('invalid login shows error', async ({ page }) => {
    await login(page, validUser.username, 'wrong_password');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match any user in this service');
  });

  test('locked out user is blocked', async ({ page }) => {
    await login(page, lockedUser.username, lockedUser.password);
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out');
  });

  test('mandatory login fields show validation errors', async ({ page }) => {
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');

    await page.locator('[data-test="username"]').fill(validUser.username);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('product list displays names and prices', async ({ page }) => {
    await login(page, validUser.username, validUser.password);

    const names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
    const prices = await page.locator('[data-test="inventory-item-price"]').allTextContents();

    expect(names.length).toBeGreaterThan(0);
    expect(prices.length).toBe(names.length);
    prices.forEach((price) => {
      expect(price).toMatch(/\$\d+(\.\d{2})?/);
    });
  });

  test('sorting dropdown works for A-Z, Z-A, Price Low-High and Price High-Low', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    const sortDropdown = page.locator('[data-test="product-sort-container"]');

    await sortDropdown.selectOption('az');
    let names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);

    await sortDropdown.selectOption('za');
    names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
    expect([...names].sort((a, b) => b.localeCompare(a))).toEqual(names);

    await sortDropdown.selectOption('lohi');
    const pricesLowHigh = await page.locator('[data-test="inventory-item-price"]').allTextContents();
    const parsedLowHigh = pricesLowHigh.map(parseCurrency);
    expect([...parsedLowHigh].sort((a, b) => a - b)).toEqual(parsedLowHigh);

    await sortDropdown.selectOption('hilo');
    const pricesHighLow = await page.locator('[data-test="inventory-item-price"]').allTextContents();
    const parsedHighLow = pricesHighLow.map(parseCurrency);
    expect([...parsedHighLow].sort((a, b) => b - a)).toEqual(parsedHighLow);
  });

  test('add to cart and multiple product selection updates cart badge', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    const firstProduct = page.locator('[data-test="inventory-item"]').first();
    const secondProduct = page.locator('[data-test="inventory-item"]').nth(1);

    await firstProduct.locator('button').click();
    await secondProduct.locator('button').click();

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
  });

  test('cart validates selected products, quantities, prices and remove functionality', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await addProducts(page, ['Sauce Labs Backpack', 'Sauce Labs Bike Light']);

    await page.locator('[data-test="shopping-cart-link"]').click();

    const cartItems = page.locator('[data-test="inventory-item"]').or(page.locator('.cart_item'));
    await expect(cartItems).toHaveCount(2);
    await expect(page.locator('[data-test="item-quantity"]')).toHaveCount(2);
    await expect(page.locator('[data-test="cart-list"]').first()).toBeVisible();

    await page.locator('button').filter({ hasText: 'Remove' }).first().click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('cart state persists while navigating between products and cart', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await addProducts(page, ['Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt']);

    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');

    await page.locator('[data-test="continue-shopping"]').click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
  });

  test('checkout shows validation errors and calculates totals correctly', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await addProducts(page, ['Sauce Labs Backpack', 'Sauce Labs Bike Light']);

    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();

    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');

    await page.locator('[data-test="firstName"]').fill('Test');
    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');

    await page.locator('[data-test="lastName"]').fill('User');
    await page.locator('[data-test="continue"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');

    await page.locator('[data-test="postalCode"]').fill('12345');
    await page.locator('[data-test="continue"]').click();

    const itemTotalText = await page.locator('[data-test="subtotal-label"]').textContent();
    const taxText = await page.locator('[data-test="tax-label"]').textContent();
    const totalText = await page.locator('[data-test="total-label"]').textContent();

    const itemTotal = parseCurrency(itemTotalText || '');
    const tax = parseCurrency(taxText || '');
    const total = parseCurrency(totalText || '');

    expect(Math.abs((itemTotal + tax) - total)).toBeLessThan(0.01);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  });

  test('successful checkout completes the purchase and shows confirmation', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await addProducts(page, ['Sauce Labs Backpack', 'Sauce Labs Bike Light']);

    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill('Test');
    await page.locator('[data-test="lastName"]').fill('User');
    await page.locator('[data-test="postalCode"]').fill('12345');
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();

    await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
    await expect(page.locator('[data-test="complete-text"]')).toContainText('Your order has been dispatched');
  });

  test('end-to-end flow completes login, cart, checkout and order confirmation', async ({ page }) => {
    await login(page, validUser.username, validUser.password);
    await addProducts(page, ['Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt']);

    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
    await page.locator('[data-test="checkout"]').click();

    await page.locator('[data-test="firstName"]').fill('End');
    await page.locator('[data-test="lastName"]').fill('To');
    await page.locator('[data-test="postalCode"]').fill('560001');
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();

    await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
  });
});
