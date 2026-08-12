import { Router } from "express";
import { body, param, query } from "express-validator";
import * as inventoryController from "../controllers/inventory.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const stockStaffAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager", "warehouseStaff"),
];

const stockOperationValidation = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("qty").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("warehouse").optional().isString().withMessage("Warehouse must be a string"),
];

router.get(
  "/public/status",
  ...validate([
    query("productIds").notEmpty().withMessage("productIds query parameter is required"),
    query("warehouse").optional().isString().withMessage("Warehouse must be a string"),
  ]),
  inventoryController.getPublicStockStatuses
);

router.get(
  "/public/:productId",
  ...validate([param("productId").isMongoId().withMessage("Invalid product ID")]),
  inventoryController.getPublicStockStatus
);

router.get(
  "/low-stock",
  ...stockStaffAuth,
  ...validate([
    query("warehouse").optional().isString().withMessage("Warehouse must be a string"),
  ]),
  inventoryController.getLowStock
);

router.get(
  "/",
  ...stockStaffAuth,
  ...validate([
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("warehouse").optional().isString().withMessage("Warehouse must be a string"),
  ]),
  inventoryController.getAllInventory
);

router.get(
  "/:productId",
  ...stockStaffAuth,
  ...validate([
    param("productId").isMongoId().withMessage("Invalid product ID"),
    query("warehouse").optional().isString().withMessage("Warehouse must be a string"),
  ]),
  inventoryController.getInventoryByProductId
);

router.post(
  "/reserve",
  ...stockStaffAuth,
  ...validate([
    ...stockOperationValidation,
    body("sessionId").trim().notEmpty().withMessage("Session ID is required"),
  ]),
  inventoryController.reserveStock
);

router.post(
  "/release",
  ...stockStaffAuth,
  ...validate([
    ...stockOperationValidation,
    body("sessionId").optional().isString().withMessage("Session ID must be a string"),
  ]),
  inventoryController.releaseStock
);

router.post(
  "/confirm-sale",
  ...stockStaffAuth,
  ...validate([
    ...stockOperationValidation,
    body("sessionId").optional().isString().withMessage("Session ID must be a string"),
  ]),
  inventoryController.confirmSale
);

router.post(
  "/restock",
  ...stockStaffAuth,
  ...validate(stockOperationValidation),
  inventoryController.restock
);

export default router;
