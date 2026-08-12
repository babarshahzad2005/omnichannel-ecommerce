import { Router } from "express";
import { query } from "express-validator";
import * as reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.get(
  "/my",
  authenticate,
  ...validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  reviewController.getMyReviews
);

export default router;
