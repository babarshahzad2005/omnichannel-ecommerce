import type { NextFunction, Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { success } from "../utils/apiResponse";

const getParamId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.createCategory(req.body);
    success(res, category, 201);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.updateCategory(
      getParamId(req),
      req.body
    );
    success(res, category);
  } catch (err) {
    next(err);
  }
};

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const parent =
      req.query.parent === "null"
        ? null
        : typeof req.query.parent === "string"
          ? req.query.parent
          : undefined;

    const result = await categoryService.getAllCategories({
      page,
      limit,
      parent,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.getCategoryById(getParamId(req));
    success(res, category);
  } catch (err) {
    next(err);
  }
};

export const getCategoryTree = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tree = await categoryService.getCategoryTree();
    success(res, tree);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.deleteCategory(getParamId(req));
    success(res, category);
  } catch (err) {
    next(err);
  }
};
