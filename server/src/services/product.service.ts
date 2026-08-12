import { Types } from "mongoose";
import { Category } from "../models/product/Category";
import {
  Product,
  type IProduct,
  type IProductAttribute,
  type IProductImage,
  type IProductVariant,
} from "../models/product/Product";
import { ApiError } from "../utils/ApiError";

export interface CreateProductInput {
  name: string;
  description: string;
  richDescription?: string;
  sku: string;
  brand?: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  variants?: IProductVariant[];
  attributes?: IProductAttribute[];
  images?: IProductImage[];
  tags?: string[];
  isFeatured?: boolean;
  createdBy: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  richDescription?: string;
  sku?: string;
  brand?: string;
  category?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  variants?: IProductVariant[];
  attributes?: IProductAttribute[];
  images?: IProductImage[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface GetProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  sort?: string;
  fields?: string;
}

export interface PaginatedProducts {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ALLOWED_SORT_FIELDS = new Set([
  "name",
  "price",
  "createdAt",
  "averageRating",
  "totalSold",
  "reviewCount",
]);

const validateCategory = async (categoryId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOne({ _id: categoryId, isActive: true });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }
};

const validateSkuUnique = async (
  sku: string,
  excludeId?: string
): Promise<void> => {
  const existing = await Product.findOne({
    sku,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  if (existing) {
    throw new ApiError(409, "SKU already exists");
  }
};

const validateVariantSkus = (variants: IProductVariant[]): void => {
  const skus = new Set<string>();

  for (const variant of variants) {
    for (const option of variant.options) {
      if (skus.has(option.sku)) {
        throw new ApiError(400, `Duplicate variant SKU: ${option.sku}`);
      }

      skus.add(option.sku);
    }
  }
};

const parseSort = (sort?: string): Record<string, 1 | -1 | { $meta: string }> => {
  if (!sort) {
    return { createdAt: -1 };
  }

  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;

  if (!ALLOWED_SORT_FIELDS.has(field)) {
    throw new ApiError(400, `Invalid sort field: ${field}`);
  }

  return { [field]: descending ? -1 : 1 };
};

export const createProduct = async (
  data: CreateProductInput
): Promise<IProduct> => {
  await validateCategory(data.category);
  await validateSkuUnique(data.sku);

  if (data.variants?.length) {
    validateVariantSkus(data.variants);
  }

  const product = await Product.create({
    name: data.name,
    description: data.description,
    richDescription: data.richDescription,
    sku: data.sku,
    brand: data.brand,
    category: data.category,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    costPrice: data.costPrice,
    variants: data.variants ?? [],
    attributes: data.attributes ?? [],
    images: data.images ?? [],
    tags: data.tags ?? [],
    isFeatured: data.isFeatured ?? false,
    createdBy: data.createdBy,
  });

  return product;
};

export const getAllProducts = async (
  query: GetProductsQuery
): Promise<PaginatedProducts> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.category) {
    if (!Types.ObjectId.isValid(query.category)) {
      throw new ApiError(400, "Invalid category ID");
    }

    filter.category = query.category;
  }

  if (query.brand) {
    filter.brand = query.brand;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: { $gte?: number; $lte?: number } = {};

    if (query.minPrice !== undefined) {
      priceFilter.$gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      priceFilter.$lte = query.maxPrice;
    }

    filter.price = priceFilter;
  }

  if (query.tags?.length) {
    filter.tags = { $in: query.tags };
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const sort = query.search
    ? query.sort
      ? { score: { $meta: "textScore" as const }, ...parseSort(query.sort) }
      : { score: { $meta: "textScore" as const } }
    : parseSort(query.sort);

  let productQuery = Product.find(filter).sort(sort).skip(skip).limit(limit);

  if (query.fields) {
    const fields = query.fields
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean)
      .join(" ");

    if (fields) {
      productQuery = productQuery.select(fields);
    }
  }

  const [products, total] = await Promise.all([
    productQuery.populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("createdBy", "name email role");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
): Promise<IProduct> => {
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (data.category) {
    await validateCategory(data.category);
    product.category = new Types.ObjectId(data.category);
  }

  if (data.sku && data.sku !== product.sku) {
    await validateSkuUnique(data.sku, id);
    product.sku = data.sku;
  }

  if (data.variants) {
    validateVariantSkus(data.variants);
    product.variants = data.variants;
  }

  if (data.name !== undefined) {
    product.name = data.name;
  }

  if (data.description !== undefined) {
    product.description = data.description;
  }

  if (data.richDescription !== undefined) {
    product.richDescription = data.richDescription;
  }

  if (data.brand !== undefined) {
    product.brand = data.brand;
  }

  if (data.price !== undefined) {
    product.price = data.price;
  }

  if (data.compareAtPrice !== undefined) {
    product.compareAtPrice = data.compareAtPrice;
  }

  if (data.costPrice !== undefined) {
    product.costPrice = data.costPrice;
  }

  if (data.attributes !== undefined) {
    product.attributes = data.attributes;
  }

  if (data.images !== undefined) {
    product.images = data.images;
  }

  if (data.tags !== undefined) {
    product.tags = data.tags;
  }

  if (data.isActive !== undefined) {
    product.isActive = data.isActive;
  }

  if (data.isFeatured !== undefined) {
    product.isFeatured = data.isFeatured;
  }

  await product.save();
  return product;
};

export const deleteProduct = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  product.isActive = false;
  await product.save();

  return product;
};
