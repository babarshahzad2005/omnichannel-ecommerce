import { Types } from "mongoose";
import { Order } from "../models/order/Order";
import { Product } from "../models/product/Product";
import { Review, type IReview } from "../models/product/Review";
import { ApiError } from "../utils/ApiError";

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface GetReviewsQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedReviews {
  reviews: IReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ADMIN_ROLES = new Set(["superAdmin", "vendorManager"]);

export const isAdminRole = (role: string): boolean => ADMIN_ROLES.has(role);

const recalculateProductRatings = async (productId: string): Promise<void> => {
  const [stats] = await Review.aggregate<{
    averageRating: number;
    reviewCount: number;
  }>([
    {
      $match: {
        product: new Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats
      ? Math.round(stats.averageRating * 10) / 10
      : 0,
    reviewCount: stats?.reviewCount ?? 0,
  });
};

const hasDeliveredPurchase = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  const order = await Order.findOne({
    user: userId,
    orderStatus: "delivered",
    "items.product": productId,
  });

  return Boolean(order);
};

export const createReview = async (
  input: CreateReviewInput
): Promise<IReview> => {
  if (!Types.ObjectId.isValid(input.productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: input.productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const hasDelivered = await hasDeliveredPurchase(
    input.userId,
    input.productId
  );

  if (!hasDelivered) {
    throw new ApiError(
      403,
      "You can only review products from delivered orders"
    );
  }

  const existingReview = await Review.findOne({
    product: input.productId,
    user: input.userId,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  const review = await Review.create({
    product: input.productId,
    user: input.userId,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    images: input.images ?? [],
    isVerifiedPurchase: true,
  });

  await recalculateProductRatings(input.productId);

  await review.populate("user", "name avatar");
  return review;
};

export const getReviewsByProduct = async (
  productId: string,
  query: GetReviewsQuery
): Promise<PaginatedReviews> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {
    product: productId,
    isApproved: true,
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getReviewsByUser = async (
  userId: string,
  query: GetReviewsQuery
): Promise<PaginatedReviews> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { user: userId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("product", "name slug images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveReview = async (reviewId: string): Promise<IReview> => {
  if (!Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (!review.isApproved) {
    review.isApproved = true;
    await review.save();
    await recalculateProductRatings(review.product.toString());
  }

  await review.populate([
    { path: "user", select: "name avatar" },
    { path: "product", select: "name slug" },
  ]);

  return review;
};

export const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const isOwner = review.user.toString() === userId;

  if (!isOwner && !isAdminRole(userRole)) {
    throw new ApiError(403, "You do not have permission to delete this review");
  }

  const productId = review.product.toString();
  await review.deleteOne();
  await recalculateProductRatings(productId);
};
