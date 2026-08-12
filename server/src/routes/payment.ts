import { Router } from "express";
import { body } from "express-validator";
import { createPaymentIntentHandler } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.post(
  "/create-intent",
  authenticate,
  ...validate([
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
  ]),
  createPaymentIntentHandler
);

export default router;
