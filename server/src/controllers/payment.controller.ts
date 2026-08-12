import type { NextFunction, Request, Response } from "express";
import {
  createPaymentIntent,
  handleWebhook,
} from "../services/payment/stripe.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

export const createPaymentIntentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const result = await createPaymentIntent(req.body.orderId, req.user.id);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const handleWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      throw new ApiError(400, "Missing stripe-signature header");
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new ApiError(400, "Webhook requires raw request body");
    }

    await handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};
