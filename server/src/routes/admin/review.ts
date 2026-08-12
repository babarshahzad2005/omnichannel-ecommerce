import { Router } from "express";
import { param } from "express-validator";
import * as reviewController from "../../controllers/review.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const router = Router();

const adminAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager"),
];

router.put(
  "/:id/approve",
  ...adminAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid review ID")]),
  reviewController.approveReview
);

router.delete(
  "/:id",
  ...adminAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid review ID")]),
  reviewController.deleteReview
);

export default router;
