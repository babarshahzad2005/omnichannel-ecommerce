import { Router } from "express";
import { body, param, query } from "express-validator";
import * as cartController from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth";
import {
  optionalAuthenticate,
  resolveCartIdentity,
} from "../middleware/cart";
import { validate } from "../middleware/validate";

const router = Router();

const cartMiddleware = [optionalAuthenticate, resolveCartIdentity];

router.get("/", ...cartMiddleware, cartController.getCart);

router.post("/merge", authenticate, cartController.mergeCart);

router.post(
  "/",
  ...cartMiddleware,
  ...validate([
    body("productId").isMongoId().withMessage("Valid product ID is required"),
    body("qty").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("variantSku").optional().isString().withMessage("variantSku must be a string"),
  ]),
  cartController.addToCart
);

router.put(
  "/:productId",
  ...cartMiddleware,
  ...validate([
    param("productId").isMongoId().withMessage("Invalid product ID"),
    body("qty").isInt({ min: 0 }).withMessage("Quantity must be >= 0"),
    body("variantSku").optional().isString().withMessage("variantSku must be a string"),
  ]),
  cartController.updateCartItem
);

router.delete(
  "/:productId",
  ...cartMiddleware,
  ...validate([
    param("productId").isMongoId().withMessage("Invalid product ID"),
    query("variantSku").optional().isString().withMessage("variantSku must be a string"),
  ]),
  cartController.removeCartItem
);

router.delete("/", ...cartMiddleware, cartController.clearCart);

export default router;
