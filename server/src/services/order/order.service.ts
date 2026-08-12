import { Types } from "mongoose";
import {
  Order,
  type IOrder,
  type ITrackingInfo,
  type OrderStatus,
} from "../../models/order/Order";
import { ApiError } from "../../utils/ApiError";
import {
  emitOrderStatusUpdated,
  emitTrackingUpdate,
} from "../socket/orderEvents.service";
import { notifyCustomerOrderStatusChanged } from "../notification/triggers.service";

export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  orderStatus?: OrderStatus;
  paymentStatus?: string;
  userId?: string;
}

export interface PaginatedOrders {
  orders: IOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateOrderStatusInput {
  orderStatus: OrderStatus;
  cancelReason?: string;
  tracking?: {
    description?: string;
    location?: string;
  };
}

const ADMIN_ROLES = new Set(["superAdmin", "vendorManager", "warehouseStaff"]);

export const isAdminRole = (role: string): boolean => ADMIN_ROLES.has(role);

export const getUserOrders = async (
  userId: string,
  query: GetOrdersQuery
): Promise<PaginatedOrders> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { user: userId };

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAllOrders = async (
  query: GetOrdersQuery
): Promise<PaginatedOrders> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.userId) {
    if (!Types.ObjectId.isValid(query.userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    filter.user = query.userId;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getOrderById = async (
  orderId: string,
  userId: string,
  userRole: string
): Promise<IOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId).populate("user", "name email");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!isAdminRole(userRole)) {
    const orderUserId = String(order.user);

    if (orderUserId !== userId) {
      throw new ApiError(403, "You do not have access to this order");
    }
  }

  return order;
};

export const getOrderTracking = async (
  orderId: string,
  userId: string,
  userRole: string
): Promise<ITrackingInfo[]> => {
  const order = await getOrderById(orderId, userId, userRole);
  return order.trackingInfo;
};

export const updateOrderStatus = async (
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<IOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.orderStatus = input.orderStatus;

  const trackingEntry: ITrackingInfo = {
    status: input.orderStatus,
    timestamp: new Date(),
    description: input.tracking?.description ?? `Order status updated to ${input.orderStatus}`,
    location: input.tracking?.location,
  };

  order.trackingInfo.push(trackingEntry);

  if (input.orderStatus === "delivered") {
    order.deliveredAt = new Date();
    order.paymentStatus =
      order.paymentMethod === "cod" ? "paid" : order.paymentStatus;
  }

  if (input.orderStatus === "cancelled") {
    order.cancelledAt = new Date();
    order.cancelReason = input.cancelReason;
  }

  await order.save();

  emitOrderStatusUpdated(order);
  emitTrackingUpdate(order, trackingEntry);
  await notifyCustomerOrderStatusChanged(order);

  return order;
};
