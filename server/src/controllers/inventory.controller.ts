import type { NextFunction, Request, Response } from "express";
import * as inventoryService from "../services/inventory.service";
import { success } from "../utils/apiResponse";

const getParamProductId = (req: Request): string => {
  const { productId } = req.params;
  return Array.isArray(productId) ? productId[0] : productId;
};

export const reserveStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventory = await inventoryService.reserveStock(
      req.body.productId,
      Number(req.body.qty),
      req.body.sessionId,
      req.body.warehouse
    );

    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const releaseStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventory = await inventoryService.releaseStock(
      req.body.productId,
      Number(req.body.qty),
      req.body.sessionId,
      req.body.warehouse
    );

    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const confirmSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventory = await inventoryService.confirmSale(
      req.body.productId,
      Number(req.body.qty),
      req.body.sessionId,
      req.body.warehouse
    );

    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const restock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventory = await inventoryService.restock(
      req.body.productId,
      Number(req.body.qty),
      req.body.warehouse
    );

    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const getLowStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;
    const inventory = await inventoryService.getLowStock(warehouse);
    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const getAllInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;

    const result = await inventoryService.getAllInventory({
      page,
      limit,
      warehouse,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getInventoryByProductId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;
    const inventory = await inventoryService.getInventoryByProductId(
      getParamProductId(req),
      warehouse
    );

    success(res, inventory);
  } catch (err) {
    next(err);
  }
};

export const getPublicStockStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;
    const status = await inventoryService.getPublicStockStatus(
      getParamProductId(req),
      warehouse
    );

    success(res, status);
  } catch (err) {
    next(err);
  }
};

export const getPublicStockStatuses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;
    const productIds =
      typeof req.query.productIds === "string"
        ? req.query.productIds.split(",").map((id) => id.trim()).filter(Boolean)
        : [];

    const statuses = await inventoryService.getPublicStockStatuses(
      productIds,
      warehouse
    );

    success(res, statuses);
  } catch (err) {
    next(err);
  }
};
