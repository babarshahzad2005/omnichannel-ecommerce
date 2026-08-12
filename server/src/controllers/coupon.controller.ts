import type { NextFunction, Request, Response } from "express";
import * as couponService from "../services/coupon.service";
import { getCart } from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

const getParamId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
};

export const validateCouponHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const cart = await getCart(req.user.id);
    const subtotal = req.body.subtotal ?? cart.cartTotal;
    const items =
      req.body.items ??
      cart.items.map((item) => ({
        productId: item.productId,
        price: item.price,
        qty: item.qty,
        subtotal: item.subtotal,
      }));

    const result = await couponService.validateCoupon(
      req.body.code,
      req.user.id,
      subtotal,
      items
    );

    success(res, {
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      discount: result.discount,
      freeShipping: result.freeShipping,
    });
  } catch (err) {
    next(err);
  }
};

export const getActiveCoupons = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await couponService.getActiveCoupons();
    success(res, coupons);
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const coupon = await couponService.createCoupon({
      ...req.body,
      validFrom: new Date(req.body.validFrom),
      validUntil: new Date(req.body.validUntil),
      createdBy: req.user.id,
    });

    success(res, coupon, 201);
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updateData = { ...req.body };

    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }

    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const coupon = await couponService.updateCoupon(getParamId(req), updateData);
    success(res, coupon);
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupon = await couponService.deleteCoupon(getParamId(req));
    success(res, coupon);
  } catch (err) {
    next(err);
  }
};

export const getAllCoupons = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await couponService.getAllCoupons();
    success(res, coupons);
  } catch (err) {
    next(err);
  }
};

export const getCouponById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupon = await couponService.getCouponById(getParamId(req));
    success(res, coupon);
  } catch (err) {
    next(err);
  }
};
