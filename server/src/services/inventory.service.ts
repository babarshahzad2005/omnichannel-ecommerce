import mongoose, { Types } from "mongoose";
import { Inventory, type IInventory } from "../models/inventory/Inventory";
import { StockReservation } from "../models/inventory/StockReservation";
import { Product } from "../models/product/Product";
import { ApiError } from "../utils/ApiError";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface GetInventoryQuery {
  page?: number;
  limit?: number;
  warehouse?: string;
}

export interface PaginatedInventory {
  inventory: IInventory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublicStockStatus {
  productId: string;
  status: StockStatus;
}

const RESERVATION_TTL_MS = 15 * 60 * 1000;

const getStockStatus = (
  availableQty: number,
  reorderLevel: number
): StockStatus => {
  if (availableQty <= 0) {
    return "out_of_stock";
  }

  if (availableQty <= reorderLevel) {
    return "low_stock";
  }

  return "in_stock";
};

const ensureProductExists = async (productId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
};

const getOrCreateInventory = async (
  productId: string,
  warehouse = "main"
): Promise<IInventory> => {
  let inventory = await Inventory.findOne({ product: productId, warehouse });

  if (!inventory) {
    inventory = await Inventory.create({
      product: productId,
      warehouse,
      quantity: 0,
      reservedQty: 0,
    });
  }

  return inventory;
};

export const reserveStock = async (
  productId: string,
  qty: number,
  sessionId: string,
  warehouse = "main"
): Promise<IInventory> => {
  if (qty <= 0) {
    throw new ApiError(400, "Reservation quantity must be greater than 0");
  }

  if (!sessionId.trim()) {
    throw new ApiError(400, "Session ID is required");
  }

  await ensureProductExists(productId);
  await getOrCreateInventory(productId, warehouse);

  const existingReservation = await StockReservation.findOne({
    product: productId,
    sessionId,
    warehouse,
  });

  if (existingReservation) {
    throw new ApiError(409, "Stock already reserved for this session");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inventory = await Inventory.findOneAndUpdate(
      {
        product: productId,
        warehouse,
        $expr: {
          $gte: [{ $subtract: ["$quantity", "$reservedQty"] }, qty],
        },
      },
      { $inc: { reservedQty: qty } },
      { new: true, session }
    );

    if (!inventory) {
      throw new ApiError(409, "Insufficient stock available");
    }

    await StockReservation.create(
      [
        {
          product: productId,
          sessionId,
          quantity: qty,
          warehouse,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return inventory;
  } catch (err) {
    await session.abortTransaction();

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(409, "Insufficient stock available");
  } finally {
    session.endSession();
  }
};

export const releaseStock = async (
  productId: string,
  qty: number,
  sessionId?: string,
  warehouse = "main"
): Promise<IInventory> => {
  if (qty <= 0) {
    throw new ApiError(400, "Release quantity must be greater than 0");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let releaseQty = qty;

    if (sessionId) {
      const reservation = await StockReservation.findOne({
        product: productId,
        sessionId,
        warehouse,
      }).session(session);

      if (!reservation) {
        throw new ApiError(404, "Stock reservation not found");
      }

      releaseQty = reservation.quantity;
      await StockReservation.deleteOne({ _id: reservation._id }).session(session);
    }

    const inventory = await Inventory.findOneAndUpdate(
      {
        product: productId,
        warehouse,
        reservedQty: { $gte: releaseQty },
      },
      { $inc: { reservedQty: -releaseQty } },
      { new: true, session }
    );

    if (!inventory) {
      throw new ApiError(409, "Unable to release reserved stock");
    }

    await session.commitTransaction();
    return inventory;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const confirmSale = async (
  productId: string,
  qty: number,
  sessionId?: string,
  warehouse = "main"
): Promise<IInventory> => {
  if (qty <= 0) {
    throw new ApiError(400, "Sale quantity must be greater than 0");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (sessionId) {
      const reservation = await StockReservation.findOne({
        product: productId,
        sessionId,
        warehouse,
      }).session(session);

      if (!reservation) {
        throw new ApiError(404, "Stock reservation not found");
      }

      if (reservation.quantity !== qty) {
        throw new ApiError(400, "Sale quantity does not match reservation");
      }

      await StockReservation.deleteOne({ _id: reservation._id }).session(session);
    }

    const inventory = await Inventory.findOneAndUpdate(
      {
        product: productId,
        warehouse,
        quantity: { $gte: qty },
        reservedQty: { $gte: qty },
      },
      {
        $inc: {
          quantity: -qty,
          reservedQty: -qty,
        },
      },
      { new: true, session }
    );

    if (!inventory) {
      throw new ApiError(409, "Unable to confirm sale due to insufficient stock");
    }

    await session.commitTransaction();
    return inventory;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const restock = async (
  productId: string,
  qty: number,
  warehouse = "main"
): Promise<IInventory> => {
  if (qty <= 0) {
    throw new ApiError(400, "Restock quantity must be greater than 0");
  }

  await ensureProductExists(productId);

  const inventory = await Inventory.findOneAndUpdate(
    { product: productId, warehouse },
    {
      $inc: { quantity: qty },
      $set: { lastRestocked: new Date() },
    },
    { new: true, upsert: true }
  );

  return inventory;
};

export const getLowStock = async (warehouse?: string): Promise<IInventory[]> => {
  const filter: Record<string, unknown> = {
    $expr: {
      $lte: [{ $subtract: ["$quantity", "$reservedQty"] }, "$reorderLevel"],
    },
  };

  if (warehouse) {
    filter.warehouse = warehouse;
  }

  return Inventory.find(filter)
    .populate("product", "name sku slug")
    .sort({ quantity: 1 });
};

export const getAllInventory = async (
  query: GetInventoryQuery
): Promise<PaginatedInventory> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.warehouse) {
    filter.warehouse = query.warehouse;
  }

  const [inventory, total] = await Promise.all([
    Inventory.find(filter)
      .populate("product", "name sku slug")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(filter),
  ]);

  return {
    inventory,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getInventoryByProductId = async (
  productId: string,
  warehouse = "main"
): Promise<IInventory> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const inventory = await Inventory.findOne({ product: productId, warehouse })
    .populate("product", "name sku slug");

  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  return inventory;
};

export const getPublicStockStatus = async (
  productId: string,
  warehouse = "main"
): Promise<PublicStockStatus> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const inventory = await Inventory.findOne({ product: productId, warehouse });

  if (!inventory) {
    return {
      productId,
      status: "out_of_stock",
    };
  }

  const availableQty = inventory.quantity - inventory.reservedQty;

  return {
    productId,
    status: getStockStatus(availableQty, inventory.reorderLevel),
  };
};

export const getPublicStockStatuses = async (
  productIds: string[],
  warehouse = "main"
): Promise<PublicStockStatus[]> => {
  const validIds = productIds.filter((id) => Types.ObjectId.isValid(id));

  if (!validIds.length) {
    throw new ApiError(400, "At least one valid product ID is required");
  }

  const inventories = await Inventory.find({
    product: { $in: validIds },
    warehouse,
  });

  const inventoryMap = new Map(
    inventories.map((item) => [item.product.toString(), item])
  );

  return validIds.map((productId) => {
    const inventory = inventoryMap.get(productId);

    if (!inventory) {
      return { productId, status: "out_of_stock" as StockStatus };
    }

    const availableQty = inventory.quantity - inventory.reservedQty;

    return {
      productId,
      status: getStockStatus(availableQty, inventory.reorderLevel),
    };
  });
};

export const releaseExpiredReservations = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);
  const expiredReservations = await StockReservation.find({
    createdAt: { $lt: cutoff },
  });

  let releasedCount = 0;

  for (const reservation of expiredReservations) {
    try {
      await releaseStock(
        reservation.product.toString(),
        reservation.quantity,
        reservation.sessionId,
        reservation.warehouse
      );
      releasedCount += 1;
    } catch (err) {
      console.error(
        `Failed to release expired reservation ${reservation._id}:`,
        err
      );
    }
  }

  return releasedCount;
};
