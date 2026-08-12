import type { IInventory } from "../../models/inventory/Inventory";
import type { IOrder, OrderStatus } from "../../models/order/Order";
import type { UserRole } from "../../models/user/User";
import { User } from "../../models/user/User";
import { Inventory } from "../../models/inventory/Inventory";
import { Product } from "../../models/product/Product";
import { createNotification } from "../notification.service";

const ADMIN_ROLES: UserRole[] = ["superAdmin", "vendorManager"];

const notifyUsersByRoles = async (
  roles: UserRole[],
  notification: {
    type: Parameters<typeof createNotification>[0]["type"];
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): Promise<void> => {
  const users = await User.find({
    role: { $in: roles },
    isActive: true,
  }).select("_id");

  await Promise.all(
    users.map((user) =>
      createNotification({
        userId: user._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      })
    )
  );
};

export const notifyAdminsOrderPlaced = async (order: IOrder): Promise<void> => {
  await notifyUsersByRoles(ADMIN_ROLES, {
    type: "order_placed",
    title: "New order placed",
    message: `Order ${order.orderNumber} has been placed for $${order.total.toFixed(2)}.`,
    data: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
    },
  });
};

const getStatusNotificationContent = (
  order: IOrder,
  status: OrderStatus
): {
  type: "order_shipped" | "order_delivered" | "system";
  title: string;
  message: string;
} => {
  switch (status) {
    case "shipped":
      return {
        type: "order_shipped",
        title: "Order shipped",
        message: `Your order ${order.orderNumber} has been shipped.`,
      };
    case "delivered":
      return {
        type: "order_delivered",
        title: "Order delivered",
        message: `Your order ${order.orderNumber} has been delivered.`,
      };
    default:
      return {
        type: "system",
        title: "Order status updated",
        message: `Your order ${order.orderNumber} is now ${status.replace("_", " ")}.`,
      };
  }
};

export const notifyCustomerOrderStatusChanged = async (
  order: IOrder
): Promise<void> => {
  const content = getStatusNotificationContent(order, order.orderStatus);

  await createNotification({
    userId: order.user.toString(),
    type: content.type,
    title: content.title,
    message: content.message,
    data: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    },
  });
};

export const notifyCustomerPaymentReceived = async (
  order: IOrder
): Promise<void> => {
  await createNotification({
    userId: order.user.toString(),
    type: "payment_received",
    title: "Payment received",
    message: `Payment of $${order.total.toFixed(2)} for order ${order.orderNumber} was successful.`,
    data: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
    },
  });
};

export const notifyWarehouseLowStock = async (
  inventory: IInventory
): Promise<void> => {
  const availableQty = inventory.quantity - inventory.reservedQty;
  const product = await Product.findById(inventory.product).select("name sku");

  await notifyUsersByRoles(["warehouseStaff", "superAdmin"], {
    type: "low_stock",
    title: "Low stock alert",
    message: product
      ? `${product.name} (${product.sku}) is low on stock (${availableQty} available).`
      : `A product is low on stock (${availableQty} available).`,
    data: {
      productId: inventory.product.toString(),
      productName: product?.name,
      sku: product?.sku,
      availableQty,
      reorderLevel: inventory.reorderLevel,
      warehouse: inventory.warehouse,
    },
  });
};

export const maybeNotifyLowStock = async (
  productId: string,
  warehouse = "main"
): Promise<void> => {
  const inventory = await Inventory.findOne({ product: productId, warehouse });

  if (!inventory) {
    return;
  }

  const availableQty = inventory.quantity - inventory.reservedQty;

  if (availableQty <= inventory.reorderLevel) {
    await notifyWarehouseLowStock(inventory);
  }
};
