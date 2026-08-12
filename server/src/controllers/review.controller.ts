import type { NextFunction, Request, Response } from "express";
import * as reviewService from "../services/review.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

const getParamId = (req: Request, key: string): string => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const review = await reviewService.createReview({
      productId: getParamId(req, "productId"),
      userId: req.user.id,
      rating: Number(req.body.rating),
      title: req.body.title,
      comment: req.body.comment,
      images: req.body.images,
    });

    success(res, review, 201);
  } catch (err) {
    next(err);
  }
};

export const getReviewsByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await reviewService.getReviewsByProduct(
      getParamId(req, "productId"),
      { page, limit }
    );

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getMyReviews = async (
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

    const result = await reviewService.getReviewsByUser(req.user.id, {
      page,
      limit,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const approveReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await reviewService.approveReview(getParamId(req, "id"));
    success(res, review);
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    await reviewService.deleteReview(
      getParamId(req, "id"),
      req.user.id,
      req.user.role
    );

    success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};
