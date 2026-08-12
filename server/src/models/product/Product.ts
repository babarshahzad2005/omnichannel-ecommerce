import mongoose, {
  type Document,
  type Model,
  Schema,
  type Types,
} from "mongoose";
import slugify from "slugify";

export interface IVariantOption {
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface IProductVariant {
  type: string;
  options: IVariantOption[];
}

export interface IProductAttribute {
  key: string;
  value: string;
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  sku: string;
  brand?: string;
  category: Types.ObjectId;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  variants: IProductVariant[];
  attributes: IProductAttribute[];
  images: IProductImage[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IProductModel = Model<IProduct>;

const variantOptionSchema = new Schema<IVariantOption>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    type: { type: String, required: true, trim: true },
    options: { type: [variantOptionSchema], default: [] },
  },
  { _id: false }
);

const productAttributeSchema = new Schema<IProductAttribute>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    richDescription: {
      type: String,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    attributes: {
      type: [productAttributeSchema],
      default: [],
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });

productSchema.pre("save", async function () {
  if (!this.isModified("name") && this.slug) {
    return;
  }

  const ProductModel = this.constructor as IProductModel;
  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ProductModel.findOne({
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

export const Product = mongoose.model<IProduct, IProductModel>(
  "Product",
  productSchema
);
