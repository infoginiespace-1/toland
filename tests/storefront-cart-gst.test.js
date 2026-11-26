import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Indian GST & Apparel Pricing Calculator for TOLAND
 * - Apparel MRP <= ₹1000: 5% GST
 * - Apparel MRP > ₹1000: 12% GST
 * - Free shipping for orders >= ₹1,999
 */
export function calculateOrderSummary(items, coupon) {
  let subtotal = 0;
  let gstTotal = 0;

  for (const item of items) {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    // Indian GST Slab
    const gstRate = item.price <= 1000 ? 0.05 : 0.12;
    gstTotal += Math.round(itemTotal * gstRate);
  }

  // Coupon Discount
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal - discount + gstTotal + shipping);

  return {
    subtotal,
    discount,
    gstTotal,
    shipping,
    total,
  };
}

describe('Storefront Cart & Indian GST Calculation Suite', () => {
  test('Applies 5% GST for garments priced <= ₹1,000', () => {
    const items = [{ id: '1', price: 899, quantity: 1 }];
    const summary = calculateOrderSummary(items, null);

    assert.equal(summary.subtotal, 899);
    // 5% of 899 is 44.95 -> 45
    assert.equal(summary.gstTotal, 45);
    assert.equal(summary.shipping, 99); // < 1999
    assert.equal(summary.total, 899 + 45 + 99);
  });

  test('Applies 12% GST for premium selvedge jeans priced > ₹1,000', () => {
    const items = [{ id: 'selvedge', price: 2499, quantity: 1 }];
    const summary = calculateOrderSummary(items, null);

    assert.equal(summary.subtotal, 2499);
    // 12% of 2499 is 299.88 -> 300
    assert.equal(summary.gstTotal, 300);
    assert.equal(summary.shipping, 0); // >= 1999 free shipping
    assert.equal(summary.total, 2499 + 300);
  });

  test('Applies percentage discount with max discount capping', () => {
    const items = [{ id: 'denim', price: 3000, quantity: 1 }];
    const coupon = { type: 'percentage', value: 20, max_discount: 500 };
    const summary = calculateOrderSummary(items, coupon);

    // 20% of 3000 is 600, capped at 500
    assert.equal(summary.discount, 500);
    assert.equal(summary.total, 3000 - 500 + Math.round(3000 * 0.12));
  });

  test('Handles empty cart gracefully with zero total', () => {
    const summary = calculateOrderSummary([], null);
    assert.equal(summary.subtotal, 0);
    assert.equal(summary.total, 0);
    assert.equal(summary.shipping, 0);
  });
});
