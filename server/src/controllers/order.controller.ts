import type { NextFunction, Request, Response } from "express";
import { createOrder } from "../services/order/checkout.service";
import * as orderService from "../services/order/order.service";
import {
  generateInvoice,
  generatePackingSlip,
} from "../services/order/invoice.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";
import type { OrderStatus } from "../models/order/Order";

const getParamId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
};

export const createOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const order = await createOrder(req.user.id, req.body);
    success(res, order, 201);
  } catch (err) {
    next(err);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const orderStatus =
      typeof req.query.orderStatus === "string"
        ? (req.query.orderStatus as OrderStatus)
        : undefined;

    const result = await orderService.getUserOrders(req.user.id, {
      page,
      limit,
      orderStatus,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const order = await orderService.getOrderById(
      getParamId(req),
      req.user.id,
      req.user.role
    );

    success(res, order);
  } catch (err) {
    next(err);
  }
};

export const getOrderTracking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const tracking = await orderService.getOrderTracking(
      getParamId(req),
      req.user.id,
      req.user.role
    );

    success(res, tracking);
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await orderService.getAllOrders({
      page,
      limit,
      orderStatus:
        typeof req.query.orderStatus === "string"
          ? (req.query.orderStatus as OrderStatus)
          : undefined,
      paymentStatus:
        typeof req.query.paymentStatus === "string"
          ? req.query.paymentStatus
          : undefined,
      userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await orderService.updateOrderStatus(getParamId(req), req.body);
    success(res, order);
  } catch (err) {
    next(err);
  }
};

const sendPdf = (
  res: Response,
  buffer: Buffer,
  filename: string
): void => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
};

export const downloadInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const orderId = getParamId(req);
    const buffer = await generateInvoice(
      orderId,
      req.user.id,
      req.user.role
    );

    sendPdf(res, buffer, `invoice-${orderId}.pdf`);
  } catch (err) {
    next(err);
  }
};

export const downloadPackingSlip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const orderId = getParamId(req);
    const buffer = await generatePackingSlip(
      orderId,
      req.user.id,
      req.user.role
    );

    sendPdf(res, buffer, `packing-slip-${orderId}.pdf`);
  } catch (err) {
    next(err);
  }
};

export const downloadAdminInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = getParamId(req);
    const buffer = await generateInvoice(orderId);

    sendPdf(res, buffer, `invoice-${orderId}.pdf`);
  } catch (err) {
    next(err);
  }
};
