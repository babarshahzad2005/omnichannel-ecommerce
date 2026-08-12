import { create } from "zustand";
import * as cartService from "../services/cartService";
import type { AppliedCoupon, CartItem } from "../types/cart";
import { calculateOrderTotals } from "../utils/checkout";

interface CartState {
  items: CartItem[];
  cartTotal: number;
  loading: boolean;
  couponInput: string;
  appliedCoupon: AppliedCoupon | null;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, qty: number, variantSku?: string) => Promise<void>;
  updateItem: (productId: string, qty: number, variantSku?: string) => Promise<void>;
  removeItem: (productId: string, variantSku?: string) => Promise<void>;
  mergeAfterLogin: () => Promise<void>;
  applyCoupon: (code?: string) => Promise<void>;
  clearCoupon: () => void;
  setCouponInput: (value: string) => void;
  getTotals: () => ReturnType<typeof calculateOrderTotals>;
  reset: () => void;
}

const syncCartState = (
  items: CartItem[],
  cartTotal: number
): Pick<CartState, "items" | "cartTotal" | "itemCount"> => ({
  items,
  cartTotal,
  itemCount: items.reduce((sum, item) => sum + item.qty, 0),
});

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartTotal: 0,
  loading: false,
  couponInput: "",
  appliedCoupon: null,
  itemCount: 0,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const cart = await cartService.fetchCart();
      set({ ...syncCartState(cart.items, cart.cartTotal), loading: false });
    } catch {
      set({ ...syncCartState([], 0), loading: false });
    }
  },

  addItem: async (productId, qty, variantSku) => {
    const cart = await cartService.addToCart({ productId, qty, variantSku });
    set(syncCartState(cart.items, cart.cartTotal));
  },

  updateItem: async (productId, qty, variantSku) => {
    const cart = await cartService.updateCartItem(productId, qty, variantSku);
    set(syncCartState(cart.items, cart.cartTotal));
  },

  removeItem: async (productId, variantSku) => {
    const cart = await cartService.removeCartItem(productId, variantSku);
    set(syncCartState(cart.items, cart.cartTotal));
  },

  mergeAfterLogin: async () => {
    try {
      const cart = await cartService.mergeCart();
      set(syncCartState(cart.items, cart.cartTotal));
    } catch {
      await get().fetchCart();
    }
  },

  applyCoupon: async (code) => {
    const couponCode = (code ?? get().couponInput).trim();
    if (!couponCode) return;

    const { items, cartTotal } = get();
    const appliedCoupon = await cartService.validateCoupon({
      code: couponCode,
      subtotal: cartTotal,
      items: items.map((item) => ({
        productId: item.productId,
        price: item.price,
        qty: item.qty,
        subtotal: item.subtotal,
      })),
    });

    set({ appliedCoupon, couponInput: appliedCoupon.code });
  },

  clearCoupon: () => {
    set({ appliedCoupon: null, couponInput: "" });
  },

  setCouponInput: (value) => {
    set({ couponInput: value });
  },

  getTotals: () => {
    const { cartTotal, appliedCoupon } = get();
    return calculateOrderTotals(
      cartTotal,
      appliedCoupon?.discount ?? 0,
      appliedCoupon?.freeShipping ?? false
    );
  },

  reset: () => {
    set({
      items: [],
      cartTotal: 0,
      itemCount: 0,
      appliedCoupon: null,
      couponInput: "",
    });
  },
}));
