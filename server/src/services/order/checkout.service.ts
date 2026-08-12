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
import { ApiError } from "../../utils/ApiError";

export interface CreateOrderInput {
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

const calculateTotals = (
  subtotal: number,
  couponCode?: string
): {
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
} => {
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const discount = couponCode ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = Math.max(
    Math.round((subtotal + tax + shippingCost - discount) * 100) / 100,
    0
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

  const checkoutSessionId = `checkout-${randomUUID()}`;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of cart.items) {
      await reserveStock(
        item.productId,
        item.qty,
        checkoutSessionId,
        "main",
        session
      );
    }

    const subtotal = cart.cartTotal;
    const { tax, shippingCost, discount, total } = calculateTotals(
      subtotal,
      input.couponCode
    );

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
          tax,
          shippingCost,
          discount,
          total,
          couponCode: input.couponCode,
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

    emitOrderCreated(order);
    await notifyAdminsOrderPlaced(order);

    for (const item of cart.items) {
      await maybeNotifyLowStock(item.productId);
    }

    return order;
  } catch (err) {
    await session.abortTransaction();

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(500, "Checkout failed");
  } finally {
    session.endSession();
  }
};
