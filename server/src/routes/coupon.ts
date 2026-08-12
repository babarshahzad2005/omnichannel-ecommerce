import { Router } from "express";
import { body } from "express-validator";
import * as couponController from "../controllers/coupon.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.get("/", couponController.getActiveCoupons);

router.post(
  "/validate",
  authenticate,
  ...validate([
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("subtotal").optional().isFloat({ min: 0 }),
    body("items").optional().isArray(),
  ]),
  couponController.validateCouponHandler
);

export default router;
