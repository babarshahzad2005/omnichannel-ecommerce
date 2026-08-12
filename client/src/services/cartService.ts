import api from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  AppliedCoupon,
  CartResponse,
  CreatedOrder,
  PaymentIntentResult,
  PaymentMethod,
  ShippingAddress,
} from "../types/cart";

interface AddToCartPayload {
  productId: string;
  qty: number;
  variantSku?: string;
}

interface ValidateCouponPayload {
  code: string;
  subtotal?: number;
  items?: {
    productId: string;
    price: number;
    qty: number;
    subtotal: number;
  }[];
}

interface CreateOrderPayload {
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export async function fetchCart(): Promise<CartResponse> {
  const response = await api.get<ApiResponse<CartResponse>>("/cart");
  return response.data.data ?? { items: [], cartTotal: 0 };
}

export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  const response = await api.post<ApiResponse<CartResponse>>("/cart", payload);
  return response.data.data ?? { items: [], cartTotal: 0 };
}

export async function updateCartItem(
  productId: string,
  qty: number,
  variantSku?: string
): Promise<CartResponse> {
  const response = await api.put<ApiResponse<CartResponse>>(`/cart/${productId}`, {
    qty,
    variantSku,
  });
  return response.data.data ?? { items: [], cartTotal: 0 };
}

export async function removeCartItem(
  productId: string,
  variantSku?: string
): Promise<CartResponse> {
  const response = await api.delete<ApiResponse<CartResponse>>(`/cart/${productId}`, {
    params: variantSku ? { variantSku } : undefined,
  });
  return response.data.data ?? { items: [], cartTotal: 0 };
}

export async function mergeCart(): Promise<CartResponse> {
  const response = await api.post<ApiResponse<CartResponse>>("/cart/merge");
  return response.data.data ?? { items: [], cartTotal: 0 };
}

export async function validateCoupon(
  payload: ValidateCouponPayload
): Promise<AppliedCoupon> {
  const response = await api.post<
    ApiResponse<{
      coupon: {
        code: string;
        description?: string;
        discountType: string;
        discountValue: number;
      };
      discount: number;
      freeShipping: boolean;
    }>
  >("/coupons/validate", payload);

  const data = response.data.data;
  if (!data) {
    throw new Error("Invalid coupon response");
  }

  return {
    code: data.coupon.code,
    description: data.coupon.description,
    discountType: data.coupon.discountType,
    discountValue: data.coupon.discountValue,
    discount: data.discount,
    freeShipping: data.freeShipping,
  };
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreatedOrder> {
  const response = await api.post<ApiResponse<CreatedOrder>>("/orders", payload);
  if (!response.data.data) {
    throw new Error("Failed to create order");
  }
  return response.data.data;
}

export async function createPaymentIntent(orderId: string): Promise<PaymentIntentResult> {
  const response = await api.post<ApiResponse<PaymentIntentResult>>(
    "/payments/create-intent",
    { orderId }
  );

  if (!response.data.data?.clientSecret) {
    throw new Error("Failed to create payment intent");
  }

  return response.data.data;
}
