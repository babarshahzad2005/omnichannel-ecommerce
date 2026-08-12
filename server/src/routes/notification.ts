import { Router } from "express";
import { param, query } from "express-validator";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

router.put(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);

router.get(
  "/",
  authenticate,
  ...validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("unreadOnly").optional().isIn(["true", "false"]),
  ]),
  notificationController.getNotifications
);

router.put(
  "/:id/read",
  authenticate,
  ...validate([param("id").isMongoId().withMessage("Invalid notification ID")]),
  notificationController.markAsRead
);

export default router;
