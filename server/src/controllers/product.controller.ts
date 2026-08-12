import type { NextFunction, Request, Response } from "express";
import * as productService from "../services/product.service";
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

const parseTagsQuery = (value: unknown): string[] | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const product = await productService.createProduct({
      ...req.body,
      createdBy: req.user.id,
    });

    success(res, product, 201);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.updateProduct(getParamId(req), req.body);
    success(res, product);
  } catch (err) {
    next(err);
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const result = await productService.getAllProducts({
      page,
      limit,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
      minPrice,
      maxPrice,
      tags: parseTagsQuery(req.query.tags),
      isActive: parseBooleanQuery(req.query.isActive),
      isFeatured: parseBooleanQuery(req.query.isFeatured),
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
      fields: typeof req.query.fields === "string" ? req.query.fields : undefined,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.getProductById(getParamId(req));
    success(res, product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.deleteProduct(getParamId(req));
    success(res, product);
  } catch (err) {
    next(err);
  }
};
