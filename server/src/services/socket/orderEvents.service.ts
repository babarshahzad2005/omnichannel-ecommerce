import type {
  IOrder,
  ITrackingInfo,
} from "../../models/order/Order";
import { getOrdersNamespace } from "../../config/socket";

const ADMIN_ROLES = [
  "role:superAdmin",
  "role:vendorManager",
  "role:warehouseStaff",
] as const;

const serializeOrder = (order: IOrder): Record<string, unknown> =>
  order.toObject() as Record<string, unknown>;

const getOrderUserId = (order: IOrder): string => String(order.user);

export const emitNewOrderNotification = (order: IOrder): void => {
  const namespace = getOrdersNamespace();
  const payload = serializeOrder(order);

  for (const roleRoom of ADMIN_ROLES) {
    namespace.to(roleRoom).emit("order:new", payload);
  }
};

export const emitOrderCreated = (order: IOrder): void => {
  const namespace = getOrdersNamespace();
  const payload = serializeOrder(order);
  const userRoom = `user:${getOrderUserId(order)}`;

  namespace.to(userRoom).emit("order:created", payload);
  emitNewOrderNotification(order);
};

export const emitOrderStatusUpdated = (order: IOrder): void => {
  const namespace = getOrdersNamespace();
  const payload = serializeOrder(order);
  const userRoom = `user:${getOrderUserId(order)}`;

  namespace.to(userRoom).emit("order:statusUpdated", payload);

  for (const roleRoom of ADMIN_ROLES) {
    namespace.to(roleRoom).emit("order:statusUpdated", payload);
  }
};

export const emitTrackingUpdate = (
  order: IOrder,
  trackingEntry: ITrackingInfo
): void => {
  const namespace = getOrdersNamespace();
  const userRoom = `user:${getOrderUserId(order)}`;

  const payload = {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    trackingEntry,
  };

  namespace.to(userRoom).emit("order:trackingUpdate", payload);

  for (const roleRoom of ADMIN_ROLES) {
    namespace.to(roleRoom).emit("order:trackingUpdate", payload);
  }
};
