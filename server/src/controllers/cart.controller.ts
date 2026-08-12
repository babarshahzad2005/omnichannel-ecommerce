import type { NextFunction, Request, Response } from "express";
import * as cartService from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

const getParamProductId = (req: Request): string => {
  const { productId } = req.params;
  return Array.isArray(productId) ? productId[0] : productId;
};

const getVariantSku = (req: Request): string | undefined => {
  if (typeof req.body?.variantSku === "string" && req.body.variantSku.trim()) {
    return req.body.variantSku;
  }

  if (typeof req.query.variantSku === "string" && req.query.variantSku.trim()) {
    return req.query.variantSku;
  }

  return undefined;
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cart = await cartService.getCart(req.cartKey!);
    success(res, cart);
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cart = await cartService.addToCart(req.cartKey!, {
      productId: req.body.productId,
      qty: Number(req.body.qty),
      variantSku: req.body.variantSku,
    });

    success(res, cart, 201);
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cart = await cartService.updateCartItem(
      req.cartKey!,
      getParamProductId(req),
      Number(req.body.qty),
      getVariantSku(req)
    );

    success(res, cart);
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cart = await cartService.updateCartItem(
      req.cartKey!,
      getParamProductId(req),
      0,
      getVariantSku(req)
    );

    success(res, cart);
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await cartService.clearCart(req.cartKey!);
    success(res, { items: [], cartTotal: 0 });
  } catch (err) {
    next(err);
  }
};

export const mergeCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const guestSessionId = req.cookies?.cartSession as string | undefined;

    if (!guestSessionId) {
      const cart = await cartService.getCart(req.user.id);
      success(res, cart);
      return;
    }

    const cart = await cartService.mergeCart(guestSessionId, req.user.id);
    success(res, cart);
  } catch (err) {
    next(err);
  }
};
