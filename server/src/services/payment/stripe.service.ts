import Stripe from "stripe";
import { Types } from "mongoose";
import { getRedis } from "../../config/redis";
import { Order } from "../../models/order/Order";
import { notifyCustomerPaymentReceived } from "../notification/triggers.service";
import { ApiError } from "../../utils/ApiError";

const PROCESSED_EVENTS_KEY = "processed_events";

const getStripe = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new ApiError(500, "Stripe is not configured");
  }

  return new Stripe(secretKey);
};

const isEventProcessed = async (eventId: string): Promise<boolean> => {
  const redis = getRedis();
  return (await redis.sIsMember(PROCESSED_EVENTS_KEY, eventId)) === 1;
};

const markEventProcessed = async (eventId: string): Promise<void> => {
  const redis = getRedis();
  await redis.sAdd(PROCESSED_EVENTS_KEY, eventId);
};

export const createPaymentIntent = async (
  orderId: string,
  userId: string
): Promise<{ clientSecret: string }> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.user.toString() !== userId) {
    throw new ApiError(403, "You do not have access to this order");
  }

  if (order.paymentMethod !== "stripe") {
    throw new ApiError(400, "Order is not configured for Stripe payment");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(409, "Order has already been paid");
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError(409, "Cannot pay for a cancelled order");
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      userId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  if (!paymentIntent.client_secret) {
    throw new ApiError(500, "Failed to create payment intent");
  }

  return { clientSecret: paymentIntent.client_secret };
};

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Payment intent missing valid orderId metadata");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found for payment intent");
  }

  if (order.paymentStatus === "paid") {
    return;
  }

  order.paymentStatus = "paid";

  if (order.orderStatus === "pending_payment") {
    order.orderStatus = "processing";
  }

  order.trackingInfo.push({
    status: "processing",
    timestamp: new Date(),
    description: "Payment received successfully",
  });

  await order.save();
  await notifyCustomerPaymentReceived(order);
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Payment intent missing valid orderId metadata");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found for payment intent");
  }

  if (order.paymentStatus === "paid") {
    return;
  }

  order.paymentStatus = "failed";
  order.trackingInfo.push({
    status: "pending_payment",
    timestamp: new Date(),
    description: "Payment failed",
  });

  await order.save();
};

export const handleWebhook = async (
  payload: Buffer,
  signature: string
): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    throw new ApiError(400, "Invalid webhook signature");
  }

  if (await isEventProcessed(event.id)) {
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(
        event.data.object as Stripe.PaymentIntent
      );
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(
        event.data.object as Stripe.PaymentIntent
      );
      break;
    default:
      break;
  }

  await markEventProcessed(event.id);
};
