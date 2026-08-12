import api from "./api";
import type { ApiResponse } from "../types/auth";

interface AddToCartPayload {
  productId: string;
  qty: number;
  variantSku?: string;
}

export async function addToCart(payload: AddToCartPayload): Promise<void> {
  await api.post<ApiResponse<unknown>>("/cart", payload);
}
