import { Router } from "express";
import { body, param, query } from "express-validator";
import * as orderController from "../../controllers/order.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const router = Router();

const adminAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager", "warehouseStaff"),
];

router.get(
  "/",
  ...adminAuth,
  ...validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("orderStatus")
      .optional()
      .isIn([
        "pending_payment",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ]),
    query("paymentStatus")
      .optional()
      .isIn(["pending", "paid", "failed", "refunded"]),
    query("userId").optional().isMongoId(),
  ]),
  orderController.getAllOrders
);

router.put(
  "/:id/status",
  ...adminAuth,
  ...validate([
    param("id").isMongoId().withMessage("Invalid order ID"),
    body("orderStatus")
      .isIn([
        "pending_payment",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .withMessage("Invalid order status"),
    body("cancelReason").optional().isString(),
    body("tracking.description").optional().isString(),
    body("tracking.location").optional().isString(),
  ]),
  orderController.updateOrderStatus
);

router.get(
  "/:id/invoice",
  ...adminAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.downloadAdminInvoice
);

export default router;
