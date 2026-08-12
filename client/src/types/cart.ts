export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  variantSku?: string;
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  cartTotal: number;
}

export interface AppliedCoupon {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  discount: number;
  freeShipping: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = "stripe" | "cod";

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
}

export interface CreatedOrder {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export interface PaymentIntentResult {
  clientSecret: string;
}
