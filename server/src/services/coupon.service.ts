import { type ClientSession, Types } from "mongoose";
import {
  Coupon,
  type ICoupon,
  type DiscountType,
} from "../models/coupon/Coupon";
import { Order } from "../models/order/Order";
import { Product } from "../models/product/Product";
import { ApiError } from "../utils/ApiError";

export interface CouponLineItem {
  productId: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface CouponValidationResult {
  coupon: ICoupon;
  discount: number;
  freeShipping: boolean;
}

export interface ApplyDiscountResult {
  discount: number;
  freeShipping: boolean;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom: Date;
  validUntil: Date;
  isActive?: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdBy: string;
}

export interface UpdateCouponInput {
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
}

const normalizeCode = (code: string): string => code.toUpperCase().trim();

const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

const getEligibleItems = async (
  coupon: ICoupon,
  items: CouponLineItem[]
): Promise<CouponLineItem[]> => {
  if (
    !coupon.applicableCategories.length &&
    !coupon.applicableProducts.length
  ) {
    return items;
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "category"
  );

  const productCategoryMap = new Map(
    products.map((product) => [product._id.toString(), product.category.toString()])
  );

  const applicableProductIds = new Set(
    coupon.applicableProducts.map((id) => id.toString())
  );
  const applicableCategoryIds = new Set(
    coupon.applicableCategories.map((id) => id.toString())
  );

  return items.filter((item) => {
    if (applicableProductIds.has(item.productId)) {
      return true;
    }

    const categoryId = productCategoryMap.get(item.productId);
    return categoryId ? applicableCategoryIds.has(categoryId) : false;
  });
};

const assertCouponIsUsable = async (
  coupon: ICoupon,
  userId: string,
  subtotal: number,
  items: CouponLineItem[]
): Promise<CouponLineItem[]> => {
  if (!coupon.isActive) {
    throw new ApiError(400, "Coupon is not active");
  }

  const now = new Date();

  if (now < coupon.validFrom) {
    throw new ApiError(400, "Coupon is not yet valid");
  }

  if (now > coupon.validUntil) {
    throw new ApiError(400, "Coupon has expired");
  }

  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(409, "Coupon usage limit reached");
  }

  const userUsageCount = await Order.countDocuments({
    user: userId,
    couponCode: coupon.code,
  });

  if (userUsageCount >= coupon.maxUsesPerUser) {
    throw new ApiError(409, "You have already used this coupon the maximum number of times");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required`
    );
  }

  const eligibleItems = await getEligibleItems(coupon, items);

  if (
    (coupon.applicableCategories.length || coupon.applicableProducts.length) &&
    !eligibleItems.length
  ) {
    throw new ApiError(400, "Coupon does not apply to any items in your cart");
  }

  return eligibleItems;
};

export const applyDiscount = (
  coupon: ICoupon,
  subtotal: number,
  items: CouponLineItem[],
  eligibleItems: CouponLineItem[] = items
): ApplyDiscountResult => {
  switch (coupon.discountType) {
    case "percentage": {
      const rawDiscount = subtotal * (coupon.discountValue / 100);
      const cappedDiscount =
        coupon.maxDiscount !== undefined
          ? Math.min(rawDiscount, coupon.maxDiscount)
          : rawDiscount;

      return {
        discount: roundMoney(Math.min(cappedDiscount, subtotal)),
        freeShipping: false,
      };
    }

    case "fixed": {
      if (subtotal < coupon.minOrderAmount) {
        return { discount: 0, freeShipping: false };
      }

      return {
        discount: roundMoney(Math.min(coupon.discountValue, subtotal)),
        freeShipping: false,
      };
    }

    case "bogo": {
      if (!eligibleItems.length) {
        return { discount: 0, freeShipping: false };
      }

      const cheapestUnitPrice = Math.min(
        ...eligibleItems.map((item) => item.price)
      );

      return {
        discount: roundMoney(Math.min(cheapestUnitPrice, subtotal)),
        freeShipping: false,
      };
    }

    case "free_shipping":
      return { discount: 0, freeShipping: true };

    default:
      return { discount: 0, freeShipping: false };
  }
};

export const validateCoupon = async (
  code: string,
  userId: string,
  subtotal: number,
  items: CouponLineItem[]
): Promise<CouponValidationResult> => {
  const normalizedCode = normalizeCode(code);
  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const eligibleItems = await assertCouponIsUsable(
    coupon,
    userId,
    subtotal,
    items
  );

  const { discount, freeShipping } = applyDiscount(
    coupon,
    subtotal,
    items,
    eligibleItems
  );

  return { coupon, discount, freeShipping };
};

export const useCoupon = async (
  code: string,
  _userId: string,
  session?: ClientSession
): Promise<ICoupon> => {
  const normalizedCode = normalizeCode(code);
  const existing = await Coupon.findOne({ code: normalizedCode });

  if (!existing) {
    throw new ApiError(404, "Coupon not found");
  }

  const filter: Record<string, unknown> = {
    code: normalizedCode,
    isActive: true,
  };

  if (existing.maxUses !== undefined) {
    filter.usedCount = { $lt: existing.maxUses };
  }

  const coupon = await Coupon.findOneAndUpdate(
    filter,
    { $inc: { usedCount: 1 } },
    { new: true, session }
  );

  if (!coupon) {
    throw new ApiError(409, "Coupon is no longer available");
  }

  return coupon;
};

export const rollbackCouponUse = async (
  code: string,
  session?: ClientSession
): Promise<void> => {
  const normalizedCode = normalizeCode(code);

  await Coupon.findOneAndUpdate(
    { code: normalizedCode, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
    { session }
  );
};

export const createCoupon = async (
  data: CreateCouponInput
): Promise<ICoupon> => {
  if (data.validUntil <= data.validFrom) {
    throw new ApiError(400, "validUntil must be after validFrom");
  }

  const coupon = await Coupon.create({
    code: normalizeCode(data.code),
    description: data.description,
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxDiscount: data.maxDiscount,
    minOrderAmount: data.minOrderAmount ?? 0,
    maxUses: data.maxUses,
    maxUsesPerUser: data.maxUsesPerUser ?? 1,
    validFrom: data.validFrom,
    validUntil: data.validUntil,
    isActive: data.isActive ?? true,
    applicableCategories: data.applicableCategories,
    applicableProducts: data.applicableProducts,
    createdBy: data.createdBy,
  });

  return coupon;
};

export const updateCoupon = async (
  id: string,
  data: UpdateCouponInput
): Promise<ICoupon> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (data.validFrom && data.validUntil && data.validUntil <= data.validFrom) {
    throw new ApiError(400, "validUntil must be after validFrom");
  }

  if (data.description !== undefined) coupon.description = data.description;
  if (data.discountType !== undefined) coupon.discountType = data.discountType;
  if (data.discountValue !== undefined) coupon.discountValue = data.discountValue;
  if (data.maxDiscount !== undefined) coupon.maxDiscount = data.maxDiscount;
  if (data.minOrderAmount !== undefined) {
    coupon.minOrderAmount = data.minOrderAmount;
  }
  if (data.maxUses !== undefined) coupon.maxUses = data.maxUses;
  if (data.maxUsesPerUser !== undefined) {
    coupon.maxUsesPerUser = data.maxUsesPerUser;
  }
  if (data.validFrom !== undefined) coupon.validFrom = data.validFrom;
  if (data.validUntil !== undefined) coupon.validUntil = data.validUntil;
  if (data.isActive !== undefined) coupon.isActive = data.isActive;
  if (data.applicableCategories !== undefined) {
    coupon.applicableCategories = data.applicableCategories.map(
      (categoryId) => new Types.ObjectId(categoryId)
    );
  }
  if (data.applicableProducts !== undefined) {
    coupon.applicableProducts = data.applicableProducts.map(
      (productId) => new Types.ObjectId(productId)
    );
  }

  await coupon.save();
  return coupon;
};

export const deleteCoupon = async (id: string): Promise<ICoupon> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  coupon.isActive = false;
  await coupon.save();

  return coupon;
};

export const getCouponById = async (id: string): Promise<ICoupon> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return coupon;
};

export const getAllCoupons = async (): Promise<ICoupon[]> => {
  return Coupon.find().sort({ createdAt: -1 });
};

export const getActiveCoupons = async (): Promise<ICoupon[]> => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })
    .select("-createdBy")
    .sort({ validUntil: 1 });

  return coupons.filter(
    (coupon) =>
      coupon.maxUses === undefined || coupon.usedCount < coupon.maxUses
  );
};
