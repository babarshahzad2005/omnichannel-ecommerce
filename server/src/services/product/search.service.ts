import { Types, type PipelineStage } from "mongoose";
import { Product } from "../../models/product/Product";
import { ApiError } from "../../utils/ApiError";

export interface SearchProductsQuery {
  keyword?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  rating?: number;
  sortBy?: string;
  page: number;
  limit: number;
  facets?: boolean;
}

export interface PriceRangeFacet {
  min: number;
  max: number | null;
  count: number;
}

export interface CategoryFacet {
  id: string;
  name: string;
  count: number;
}

export interface BrandFacet {
  brand: string;
  count: number;
}

export interface RatingFacet {
  rating: number;
  count: number;
}

export interface SearchFacets {
  priceRanges: PriceRangeFacet[];
  categories: CategoryFacet[];
  brands: BrandFacet[];
  ratingDistribution: RatingFacet[];
}

export interface SearchProductsResult {
  products: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: SearchFacets;
}

const PRICE_BUCKET_BOUNDARIES = [0, 50, 100, 200, 500, 1000, 10000];
const RATING_BUCKET_BOUNDARIES = [0, 1, 2, 3, 4, 5, 6];

const ALLOWED_SORT_FIELDS = new Set([
  "price",
  "name",
  "averageRating",
  "createdAt",
  "totalSold",
  "reviewCount",
]);

const buildMatchStage = (query: SearchProductsQuery): Record<string, unknown> => {
  const match: Record<string, unknown> = { isActive: true };

  if (query.keyword?.trim()) {
    match.$text = { $search: query.keyword.trim() };
  }

  if (query.category) {
    if (!Types.ObjectId.isValid(query.category)) {
      throw new ApiError(400, "Invalid category ID");
    }

    match.category = new Types.ObjectId(query.category);
  }

  if (query.brand) {
    match.brand = query.brand;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: { $gte?: number; $lte?: number } = {};

    if (query.minPrice !== undefined) {
      priceFilter.$gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      priceFilter.$lte = query.maxPrice;
    }

    match.price = priceFilter;
  }

  if (query.tags?.length) {
    match.tags = { $in: query.tags };
  }

  if (query.rating !== undefined) {
    match.averageRating = { $gte: query.rating };
  }

  return match;
};

const buildSortStage = (
  sortBy: string | undefined,
  hasKeyword: boolean
): Record<string, 1 | -1 | { $meta: "textScore" }> => {
  if ((sortBy === "relevance" || !sortBy) && hasKeyword) {
    return { score: { $meta: "textScore" } };
  }

  if (!sortBy) {
    return { createdAt: -1 };
  }

  const descending = sortBy.startsWith("-");
  const field = descending ? sortBy.slice(1) : sortBy;

  if (!ALLOWED_SORT_FIELDS.has(field)) {
    throw new ApiError(400, `Invalid sort field: ${field}`);
  }

  return { [field]: descending ? -1 : 1 };
};

const buildResultsPipeline = (
  query: SearchProductsQuery,
  skip: number
): PipelineStage[] => {
  const hasKeyword = Boolean(query.keyword?.trim());
  const stages: PipelineStage[] = [];

  if (hasKeyword) {
    stages.push({
      $addFields: {
        score: { $meta: "textScore" },
      },
    });
  }

  stages.push(
    { $sort: buildSortStage(query.sortBy, hasKeyword) },
    { $skip: skip },
    { $limit: query.limit },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        sku: 1,
        brand: 1,
        price: 1,
        compareAtPrice: 1,
        images: 1,
        tags: 1,
        averageRating: 1,
        reviewCount: 1,
        totalSold: 1,
        isFeatured: 1,
        createdAt: 1,
        score: 1,
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
        },
      },
    }
  );

  return stages;
};

const buildMetadataPipeline = (): PipelineStage[] => [
  {
    $facet: {
      total: [{ $count: "count" }],
      priceRanges: [
        {
          $bucket: {
            groupBy: "$price",
            boundaries: PRICE_BUCKET_BOUNDARIES,
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ],
      categories: [
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: { $arrayElemAt: ["$categoryInfo.name", 0] },
          },
        },
        { $sort: { count: -1 } },
      ],
      brands: [
        {
          $match: {
            brand: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ],
      ratingDistribution: [
        {
          $bucket: {
            groupBy: "$averageRating",
            boundaries: RATING_BUCKET_BOUNDARIES,
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ],
    },
  },
];

const formatPriceRanges = (
  buckets: Array<{ _id: number | string; count: number }>
): PriceRangeFacet[] =>
  buckets
    .filter((bucket) => bucket._id !== "other")
    .map((bucket) => {
      const min = bucket._id as number;
      const index = PRICE_BUCKET_BOUNDARIES.indexOf(min);
      const max =
        index >= 0 && index < PRICE_BUCKET_BOUNDARIES.length - 1
          ? PRICE_BUCKET_BOUNDARIES[index + 1]
          : null;

      return { min, max, count: bucket.count };
    });

const formatCategories = (
  groups: Array<{ _id: Types.ObjectId; name?: string; count: number }>
): CategoryFacet[] =>
  groups.map((group) => ({
    id: group._id.toString(),
    name: group.name ?? "Unknown",
    count: group.count,
  }));

const formatBrands = (
  groups: Array<{ _id: string; count: number }>
): BrandFacet[] =>
  groups.map((group) => ({
    brand: group._id,
    count: group.count,
  }));

const formatRatingDistribution = (
  buckets: Array<{ _id: number | string; count: number }>
): RatingFacet[] =>
  buckets
    .filter((bucket) => bucket._id !== "other")
    .map((bucket) => ({
      rating: bucket._id as number,
      count: bucket.count,
    }));

export const searchProducts = async (
  query: SearchProductsQuery
): Promise<SearchProductsResult> => {
  const page = Math.max(query.page, 1);
  const limit = Math.min(Math.max(query.limit, 1), 100);
  const skip = (page - 1) * limit;

  const matchStage = buildMatchStage(query);
  const resultsPipeline = buildResultsPipeline(query, skip);

  const pipeline: PipelineStage[] = [{ $match: matchStage }];

  if (query.facets) {
    pipeline.push({
      $facet: {
        metadata: buildMetadataPipeline() as PipelineStage.FacetPipelineStage[],
        results: resultsPipeline as PipelineStage.FacetPipelineStage[],
      },
    });

    const [aggregationResult] = await Product.aggregate<{
      metadata: Array<{
        total: Array<{ count: number }>;
        priceRanges: Array<{ _id: number | string; count: number }>;
        categories: Array<{
          _id: Types.ObjectId;
          name?: string;
          count: number;
        }>;
        brands: Array<{ _id: string; count: number }>;
        ratingDistribution: Array<{ _id: number | string; count: number }>;
      }>;
      results: Record<string, unknown>[];
    }>(pipeline);

    const metadata = aggregationResult.metadata[0];
    const total = metadata?.total[0]?.count ?? 0;

    return {
      products: aggregationResult.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      facets: {
        priceRanges: formatPriceRanges(metadata?.priceRanges ?? []),
        categories: formatCategories(metadata?.categories ?? []),
        brands: formatBrands(metadata?.brands ?? []),
        ratingDistribution: formatRatingDistribution(
          metadata?.ratingDistribution ?? []
        ),
      },
    };
  }

  pipeline.push({
    $facet: {
      total: [{ $count: "count" }],
      results: resultsPipeline as PipelineStage.FacetPipelineStage[],
    },
  });

  const [aggregationResult] = await Product.aggregate<{
    total: Array<{ count: number }>;
    results: Record<string, unknown>[];
  }>(pipeline);

  const total = aggregationResult.total[0]?.count ?? 0;

  return {
    products: aggregationResult.results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
