import { randomUUID } from "crypto";
import mongoose, { Types } from "mongoose";
import {
  Order,
  type IAddress,
  type IOrder,
  type PaymentMethod,
} from "../../models/order/Order";
import { clearCart, getCart } from "../cart.service";
import { confirmSale, reserveStock } from "../inventory.service";
import { emitOrderCreated } from "../socket/orderEvents.service";
import {
  notifyAdminsOrderPlaced,
  maybeNotifyLowStock,
} from "../notification/triggers.service";
import {
  rollbackCouponUse,
  useCoupon,
  validateCoupon,
  type CouponLineItem,
} from "../coupon.service";
import { ApiError } from "../../utils/ApiError";
import { invalidateAnalyticsCache } from "../../utils/analyticsCache";

export interface CreateOrderInput {
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

const calculateTotals = (
  subtotal: number,
  discount: number,
  freeShipping: boolean
): {
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
} => {
  const taxableAmount = Math.max(subtotal - discount, 0);
  const tax = roundMoney(taxableAmount * 0.08);
  const shippingCost = freeShipping || subtotal >= 100 ? 0 : 9.99;
  const total = roundMoney(
    Math.max(subtotal + tax + shippingCost - discount, 0)
  );

  return { tax, shippingCost, discount, total };
};

export const createOrder = async (
  userId: string,
  input: CreateOrderInput
): Promise<IOrder> => {
  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw new ApiError(400, "Cart is empty");
  }

  const couponItems: CouponLineItem[] = cart.items.map((item) => ({
    productId: item.productId,
    price: item.price,
    qty: item.qty,
    subtotal: item.subtotal,
  }));

  const subtotal = cart.cartTotal;
  let discount = 0;
  let freeShipping = false;
  let appliedCouponCode: string | undefined;

  if (input.couponCode) {
    const couponResult = await validateCoupon(
      input.couponCode,
      userId,
      subtotal,
      couponItems
    );

    discount = couponResult.discount;
    freeShipping = couponResult.freeShipping;
    appliedCouponCode = couponResult.coupon.code;
  }

  const totals = calculateTotals(subtotal, discount, freeShipping);

  const checkoutSessionId = `checkout-${randomUUID()}`;
  const session = await mongoose.startSession();
  session.startTransaction();

  let couponUsed = false;

  try {
    if (appliedCouponCode) {
      await useCoupon(appliedCouponCode, userId, session);
      couponUsed = true;
    }

    for (const item of cart.items) {
      await reserveStock(
        item.productId,
        item.qty,
        checkoutSessionId,
        "main",
        session
      );
    }

    const orderItems = cart.items.map((item) => ({
      product: new Types.ObjectId(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.qty,
      variant: item.variantSku,
      image: item.image,
      subtotal: item.subtotal,
    }));

    const orderStatus =
      input.paymentMethod === "cod" ? "processing" : "pending_payment";

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          orderStatus,
          subtotal,
          tax: totals.tax,
          shippingCost: totals.shippingCost,
          discount: totals.discount,
          total: totals.total,
          couponCode: appliedCouponCode,
          notes: input.notes,
          trackingInfo: [
            {
              status: orderStatus,
              timestamp: new Date(),
              description: "Order placed successfully",
            },
          ],
        },
      ],
      { session }
    );

    for (const item of cart.items) {
      await confirmSale(
        item.productId,
        item.qty,
        checkoutSessionId,
        "main",
        session
      );
    }

    await session.commitTransaction();
    await clearCart(userId);

    await invalidateAnalyticsCache();

    emitOrderCreated(order);
    await notifyAdminsOrderPlaced(order);

    for (const item of cart.items) {
      await maybeNotifyLowStock(item.productId);
    }

    return order;
  } catch (err) {
    await session.abortTransaction();

    if (couponUsed && appliedCouponCode) {
      await rollbackCouponUse(appliedCouponCode);
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(500, "Checkout failed");
  } finally {
    session.endSession();
  }
};
