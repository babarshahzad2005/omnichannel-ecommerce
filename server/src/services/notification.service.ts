import { Types } from "mongoose";
import { getOrdersNamespace } from "../config/socket";
import {
  Notification,
  type INotification,
  type NotificationType,
} from "../models/Notification";
import { ApiError } from "../utils/ApiError";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotifications {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emitNotification = (notification: INotification): void => {
  try {
    const namespace = getOrdersNamespace();
    const payload = notification.toObject();

    namespace
      .to(`user:${notification.user.toString()}`)
      .emit("notification:new", payload);
  } catch {
    // Socket may not be initialized during tests or startup
  }
};

export const createNotification = async (
  input: CreateNotificationInput
): Promise<INotification> => {
  if (!Types.ObjectId.isValid(input.userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const notification = await Notification.create({
    user: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data,
  });

  emitNotification(notification);

  return notification;
};

export const getNotifications = async (
  userId: string,
  query: GetNotificationsQuery
): Promise<PaginatedNotifications> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { user: userId };

  if (query.unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<INotification> => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return result.modifiedCount;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ user: userId, isRead: false });
};
