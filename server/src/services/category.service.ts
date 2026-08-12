import { Types } from "mongoose";
import {
  Category,
  type ICategory,
  type CategoryTreeNode,
} from "../models/product/Category";
import { ApiError } from "../utils/ApiError";

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parent?: string;
  image?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parent?: string | null;
  image?: string;
  isActive?: boolean;
}

export interface GetCategoriesQuery {
  page?: number;
  limit?: number;
  parent?: string | null;
}

export interface PaginatedCategories {
  categories: ICategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const validateParent = async (
  parentId: string,
  categoryId?: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(parentId)) {
    throw new ApiError(400, "Invalid parent category ID");
  }

  if (categoryId && parentId === categoryId) {
    throw new ApiError(400, "Category cannot be its own parent");
  }

  const parentCategory = await Category.findOne({
    _id: parentId,
    isActive: true,
  });

  if (!parentCategory) {
    throw new ApiError(404, "Parent category not found");
  }

  if (categoryId) {
    const descendants = await Category.aggregate([
      { $match: { _id: new Types.ObjectId(categoryId) } },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "descendants",
        },
      },
    ]);

    const descendantIds =
      descendants[0]?.descendants?.map((item: { _id: Types.ObjectId }) =>
        item._id.toString()
      ) ?? [];

    if (descendantIds.includes(parentId)) {
      throw new ApiError(400, "Category cannot be nested under its own descendant");
    }
  }
};

export const createCategory = async (
  data: CreateCategoryInput
): Promise<ICategory> => {
  if (data.parent) {
    await validateParent(data.parent);
  }

  const category = await Category.create({
    name: data.name,
    description: data.description,
    parent: data.parent || undefined,
    image: data.image,
  });

  return category;
};

export const updateCategory = async (
  id: string,
  data: UpdateCategoryInput
): Promise<ICategory> => {
  const category = await Category.findOne({ _id: id, isActive: true });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (data.parent) {
    await validateParent(data.parent, id);
    category.parent = new Types.ObjectId(data.parent);
  } else if (data.parent === null) {
    category.parent = undefined;
  }

  if (data.name !== undefined) {
    category.name = data.name;
  }

  if (data.description !== undefined) {
    category.description = data.description;
  }

  if (data.image !== undefined) {
    category.image = data.image;
  }

  if (data.isActive !== undefined) {
    category.isActive = data.isActive;
  }

  await category.save();
  return category;
};

export const getAllCategories = async (
  query: GetCategoriesQuery
): Promise<PaginatedCategories> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };

  if (query.parent === null) {
    filter.parent = null;
  } else if (query.parent) {
    if (!Types.ObjectId.isValid(query.parent)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    filter.parent = query.parent;
  }

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate("parent", "name slug"),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCategoryById = async (id: string): Promise<ICategory> => {
  const category = await Category.findOne({ _id: id, isActive: true })
    .populate("parent", "name slug")
    .populate({
      path: "subcategories",
      match: { isActive: true },
      select: "name slug description image parent isActive",
    });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

export const getCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  return Category.getTree();
};

export const deleteCategory = async (id: string): Promise<ICategory> => {
  const category = await Category.findOne({ _id: id, isActive: true });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  category.isActive = false;
  await category.save();

  return category;
};
