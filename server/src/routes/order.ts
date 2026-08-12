import { Router } from "express";
import { body, param, query } from "express-validator";
import * as orderController from "../controllers/order.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const addressValidation = [
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Full name is required"),
  body("shippingAddress.phone").trim().notEmpty().withMessage("Phone is required"),
  body("shippingAddress.addressLine1").trim().notEmpty().withMessage("Address line 1 is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.state").trim().notEmpty().withMessage("State is required"),
  body("shippingAddress.postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("shippingAddress.country").trim().notEmpty().withMessage("Country is required"),
  body("shippingAddress.addressLine2").optional().isString(),
  body("billingAddress.fullName").optional().trim().notEmpty(),
  body("billingAddress.phone").optional().trim().notEmpty(),
  body("billingAddress.addressLine1").optional().trim().notEmpty(),
  body("billingAddress.city").optional().trim().notEmpty(),
  body("billingAddress.state").optional().trim().notEmpty(),
  body("billingAddress.postalCode").optional().trim().notEmpty(),
  body("billingAddress.country").optional().trim().notEmpty(),
];

router.post(
  "/",
  authenticate,
  ...validate([
    ...addressValidation,
    body("paymentMethod")
      .isIn(["stripe", "paypal", "cod"])
      .withMessage("Invalid payment method"),
    body("couponCode").optional().isString(),
    body("notes").optional().isString(),
  ]),
  orderController.createOrderHandler
);

router.get(
  "/",
  authenticate,
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
  ]),
  orderController.getUserOrders
);

router.get(
  "/:id/invoice",
  authenticate,
  ...validate([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.downloadInvoice
);

router.get(
  "/:id/packing-slip",
  authenticate,
  ...validate([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.downloadPackingSlip
);

router.get(
  "/:id/tracking",
  authenticate,
  ...validate([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.getOrderTracking
);

router.get(
  "/:id",
  authenticate,
  ...validate([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.getOrderById
);

export default router;
