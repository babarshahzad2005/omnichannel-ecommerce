import mongoose, {
  type Document,
  type Model,
  Schema,
  type Types,
} from "mongoose";
import slugify from "slugify";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId;
  image?: string;
  isActive: boolean;
  descendants: CategoryTreeNode[];
  depth?: number;
}

export interface ICategoryModel extends Model<ICategory> {
  getTree(): Promise<CategoryTreeNode[]>;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

categorySchema.pre("save", async function () {
  if (!this.isModified("name") && this.slug) {
    return;
  }

  const CategoryModel = this.constructor as ICategoryModel;
  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await CategoryModel.findOne({
      slug,
      _id: { $ne: this._id },
    });

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  this.slug = slug;
});

categorySchema.statics.getTree = async function (): Promise<CategoryTreeNode[]> {
  return this.aggregate([
    { $match: { parent: null, isActive: true } },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parent",
        as: "descendants",
        depthField: "depth",
        restrictSearchWithMatch: { isActive: true },
      },
    },
    { $sort: { name: 1 } },
  ]);
};

export const Category = mongoose.model<ICategory, ICategoryModel>(
  "Category",
  categorySchema
);
