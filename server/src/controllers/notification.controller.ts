import type { NextFunction, Request, Response } from "express";
import * as notificationService from "../services/notification.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

const getParamId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
};

const parseBooleanQuery = (value: unknown): boolean | undefined => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

export const getNotifications = async (
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

    const result = await notificationService.getNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: parseBooleanQuery(req.query.unreadOnly),
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const notification = await notificationService.markAsRead(
      getParamId(req),
      req.user.id
    );

    success(res, notification);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const count = await notificationService.markAllAsRead(req.user.id);
    success(res, { markedAsRead: count });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const count = await notificationService.getUnreadCount(req.user.id);
    success(res, { count });
  } catch (err) {
    next(err);
  }
};
