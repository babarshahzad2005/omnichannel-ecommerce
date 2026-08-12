import { Router } from "express";
import { query } from "express-validator";
import * as analyticsController from "../../controllers/analytics.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const router = Router();

const adminAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager"),
];

const dateRangeValidation = [
  query("startDate").optional().isISO8601().withMessage("Invalid startDate"),
  query("endDate").optional().isISO8601().withMessage("Invalid endDate"),
];

router.get(
  "/sales-overview",
  ...adminAuth,
  ...validate([
    ...dateRangeValidation,
    query("period").optional().isIn(["day", "week", "month"]),
  ]),
  analyticsController.getSalesOverview
);

router.get(
  "/top-products",
  ...adminAuth,
  ...validate([
    ...dateRangeValidation,
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ]),
  analyticsController.getTopProducts
);

router.get(
  "/revenue-chart",
  ...adminAuth,
  ...validate([
    ...dateRangeValidation,
    query("granularity").optional().isIn(["day", "week", "month"]),
  ]),
  analyticsController.getRevenueChart
);

router.get(
  "/customer-stats",
  ...adminAuth,
  ...validate(dateRangeValidation),
  analyticsController.getCustomerStats
);

router.get(
  "/inventory-report",
  ...adminAuth,
  ...validate(dateRangeValidation),
  analyticsController.getInventoryReport
);

export default router;
