import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface IStockReservation extends Document {
  product: Types.ObjectId;
  sessionId: string;
  quantity: number;
  warehouse: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockReservationSchema = new Schema<IStockReservation>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Reservation quantity must be at least 1"],
    },
    warehouse: {
      type: String,
      default: "main",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

stockReservationSchema.index({ createdAt: 1 });

export const StockReservation = mongoose.model<IStockReservation>(
  "StockReservation",
  stockReservationSchema
);
