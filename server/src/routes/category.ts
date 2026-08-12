import { Router } from "express";
import { body, param } from "express-validator";
import * as categoryController from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const manageCategoryAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager"),
];

router.get("/", categoryController.getAllCategories);
router.get("/tree", categoryController.getCategoryTree);

router.get(
  "/:id",
  ...validate([param("id").isMongoId().withMessage("Invalid category ID")]),
  categoryController.getCategoryById
);

router.post(
  "/",
  ...manageCategoryAuth,
  ...validate([
    body("name").trim().notEmpty().withMessage("Category name is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
    body("parent").optional().isMongoId().withMessage("Invalid parent category ID"),
    body("image").optional().isURL().withMessage("Image must be a valid URL"),
  ]),
  categoryController.createCategory
);

router.put(
  "/:id",
  ...manageCategoryAuth,
  ...validate([
    param("id").isMongoId().withMessage("Invalid category ID"),
    body("name").optional().trim().notEmpty().withMessage("Category name cannot be empty"),
    body("description").optional().isString().withMessage("Description must be a string"),
    body("parent")
      .optional({ values: "null" })
      .custom((value) => value === null || (typeof value === "string" && /^[a-f\d]{24}$/i.test(value)))
      .withMessage("Parent must be a valid ID or null"),
    body("image").optional().isURL().withMessage("Image must be a valid URL"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  ]),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  ...manageCategoryAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid category ID")]),
  categoryController.deleteCategory
);

export default router;
