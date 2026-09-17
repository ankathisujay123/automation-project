# Sauce Demo Playwright Automation

This project includes Playwright TypeScript automation for the Sauce Demo website.

## Features covered
- Login: valid, invalid, locked-out, required fields
- Product list validation: names, prices, sorting (A-Z, Z-A, Price Low-High, Price High-Low)
- Cart: add/remove, quantities, multiple products, navigation state
- Checkout: required field validation, overview totals, successful order completion
- End-to-end flow: Login -> Products -> Cart -> Checkout -> Finish

## Run locally
```bash
npm install
npx playwright test tests/sauce-demo.spec.ts --project=chromium --reporter=line
```

## Environment
This suite uses the public Sauce Demo site:
https://www.saucedemo.com/

## Notes
Use the standard test credentials included in the tests:
- Username: standard_user
- Password: secret_sauce

Other user credentials used in validation scenarios:
- locked_out_user / secret_sauce
- invalid password for negative case
