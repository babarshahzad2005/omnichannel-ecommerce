import { Router } from "express";
import { body, param } from "express-validator";
import * as couponController from "../../controllers/coupon.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const router = Router();

const adminAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager"),
];

const couponBodyValidation = [
  body("code").optional().trim().notEmpty(),
  body("description").optional().isString(),
  body("discountType")
    .optional()
    .isIn(["percentage", "fixed", "bogo", "free_shipping"]),
  body("discountValue").optional().isFloat({ min: 0 }),
  body("maxDiscount").optional().isFloat({ min: 0 }),
  body("minOrderAmount").optional().isFloat({ min: 0 }),
  body("maxUses").optional().isInt({ min: 1 }),
  body("maxUsesPerUser").optional().isInt({ min: 1 }),
  body("validFrom").optional().isISO8601(),
  body("validUntil").optional().isISO8601(),
  body("isActive").optional().isBoolean(),
  body("applicableCategories").optional().isArray(),
  body("applicableProducts").optional().isArray(),
];

router.get("/", ...adminAuth, couponController.getAllCoupons);

router.get(
  "/:id",
  ...adminAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid coupon ID")]),
  couponController.getCouponById
);

router.post(
  "/",
  ...adminAuth,
  ...validate([
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("discountType")
      .isIn(["percentage", "fixed", "bogo", "free_shipping"])
      .withMessage("Invalid discount type"),
    body("discountValue").isFloat({ min: 0 }).withMessage("discountValue must be >= 0"),
    body("validFrom").isISO8601().withMessage("validFrom must be a valid date"),
    body("validUntil").isISO8601().withMessage("validUntil must be a valid date"),
    ...couponBodyValidation.slice(1),
  ]),
  couponController.createCoupon
);

router.put(
  "/:id",
  ...adminAuth,
  ...validate([
    param("id").isMongoId().withMessage("Invalid coupon ID"),
    ...couponBodyValidation,
  ]),
  couponController.updateCoupon
);

router.delete(
  "/:id",
  ...adminAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid coupon ID")]),
  couponController.deleteCoupon
);

export default router;
