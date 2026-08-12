import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface IInventory extends Document {
  product: Types.ObjectId;
  warehouse: string;
  quantity: number;
  reservedQty: number;
  reorderLevel: number;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
  availableQty: number;
}

const inventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      unique: true,
    },
    warehouse: {
      type: String,
      default: "main",
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    reservedQty: {
      type: Number,
      required: [true, "Reserved quantity is required"],
      min: [0, "Reserved quantity cannot be negative"],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, "Reorder level cannot be negative"],
    },
    lastRestocked: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventorySchema.virtual("availableQty").get(function (this: IInventory) {
  return this.quantity - this.reservedQty;
});

inventorySchema.pre("save", function () {
  if (this.reservedQty > this.quantity) {
    throw new Error("Reserved quantity cannot exceed total quantity");
  }
});

inventorySchema.index({ warehouse: 1 });

export const Inventory = mongoose.model<IInventory>("Inventory", inventorySchema);
