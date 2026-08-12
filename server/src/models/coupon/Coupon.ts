import mongoose, { type Document, Schema, type Types } from "mongoose";

export type DiscountType = "percentage" | "fixed" | "bogo" | "free_shipping";

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableCategories: Types.ObjectId[];
  applicableProducts: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "bogo", "free_shipping"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableCategories: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    applicableProducts: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
});

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
