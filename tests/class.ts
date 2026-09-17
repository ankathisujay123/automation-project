function calculateOrderTotal(price: number, taxRate: number, discountCode?: string) {
  const tax = price * taxRate;
  return {
    subtotal: price,
    tax,
    finalTotal: price + tax,
  };
}

// Extract the type of the function signature itself
type OrderCalculator = typeof calculateOrderTotal;
// Type: (price: number, taxRate: number, discountCode?: string) => { subtotal: number; tax: number; finalTotal: number; }

// Use TypeScript's built-in ReturnType utility to extract just the return object:
type OrderResult = ReturnType<typeof calculateOrderTotal>;
// Type: { subtotal: number; tax: number; finalTotal: number; }