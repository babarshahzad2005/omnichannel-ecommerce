import type { NextFunction, Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";
import { success } from "../utils/apiResponse";

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return new Date(value);
};

const parseDateRange = (req: Request) => ({
  startDate: parseDate(req.query.startDate),
  endDate: parseDate(req.query.endDate),
});

export const getSalesOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const period =
      typeof req.query.period === "string" &&
      ["day", "week", "month"].includes(req.query.period)
        ? (req.query.period as "day" | "week" | "month")
        : undefined;

    const data = await analyticsService.getSalesOverview({
      ...parseDateRange(req),
      period,
    });

    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const data = await analyticsService.getTopProducts({
      ...parseDateRange(req),
      limit,
    });

    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getRevenueChart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const granularity =
      typeof req.query.granularity === "string" &&
      ["day", "week", "month"].includes(req.query.granularity)
        ? (req.query.granularity as "day" | "week" | "month")
        : undefined;

    const data = await analyticsService.getRevenueChart({
      ...parseDateRange(req),
      granularity,
    });

    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await analyticsService.getCustomerStats(parseDateRange(req));
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await analyticsService.getInventoryReport(parseDateRange(req));
    success(res, data);
  } catch (err) {
    next(err);
  }
};
