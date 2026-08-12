import type { OrderTotals } from "../types/cart";

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export function calculateOrderTotals(
  subtotal: number,
  discount = 0,
  freeShipping = false
): OrderTotals {
  const taxableAmount = Math.max(subtotal - discount, 0);
  const tax = roundMoney(taxableAmount * 0.08);
  const shippingCost = freeShipping || subtotal >= 100 ? 0 : 9.99;
  const total = roundMoney(Math.max(subtotal + tax + shippingCost - discount, 0));

  return { subtotal, discount, tax, shippingCost, total };
}

export function getCartItemCount(items: { qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function formatReservationTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
