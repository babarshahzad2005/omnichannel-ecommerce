import { Router } from "express";
import { body, param, query } from "express-validator";
import * as productController from "../controllers/product.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const manageProductAuth = [
  authenticate,
  authorize("superAdmin", "vendorManager"),
];

const variantOptionValidation = [
  body("variants.*.options.*.name").trim().notEmpty().withMessage("Variant option name is required"),
  body("variants.*.options.*.sku").trim().notEmpty().withMessage("Variant option SKU is required"),
  body("variants.*.options.*.price").isFloat({ min: 0 }).withMessage("Variant price must be >= 0"),
  body("variants.*.options.*.stock").isInt({ min: 0 }).withMessage("Variant stock must be >= 0"),
];

const createProductValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").trim().notEmpty().withMessage("Product description is required"),
  body("richDescription").optional().isString().withMessage("Rich description must be a string"),
  body("sku").trim().notEmpty().withMessage("SKU is required"),
  body("brand").optional().isString().withMessage("Brand must be a string"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be >= 0"),
  body("compareAtPrice").optional().isFloat({ min: 0 }).withMessage("Compare at price must be >= 0"),
  body("costPrice").optional().isFloat({ min: 0 }).withMessage("Cost price must be >= 0"),
  body("variants").optional().isArray().withMessage("Variants must be an array"),
  body("variants.*.type").trim().notEmpty().withMessage("Variant type is required"),
  body("attributes").optional().isArray().withMessage("Attributes must be an array"),
  body("attributes.*.key").trim().notEmpty().withMessage("Attribute key is required"),
  body("attributes.*.value").trim().notEmpty().withMessage("Attribute value is required"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*.url").isURL().withMessage("Image URL must be valid"),
  body("images.*.alt").optional().isString().withMessage("Image alt must be a string"),
  body("images.*.isPrimary").optional().isBoolean().withMessage("isPrimary must be a boolean"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").isString().withMessage("Each tag must be a string"),
  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean"),
  ...variantOptionValidation,
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("richDescription").optional().isString().withMessage("Rich description must be a string"),
  body("sku").optional().trim().notEmpty().withMessage("SKU cannot be empty"),
  body("brand").optional().isString().withMessage("Brand must be a string"),
  body("category").optional().isMongoId().withMessage("Invalid category ID"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be >= 0"),
  body("compareAtPrice").optional().isFloat({ min: 0 }).withMessage("Compare at price must be >= 0"),
  body("costPrice").optional().isFloat({ min: 0 }).withMessage("Cost price must be >= 0"),
  body("variants").optional().isArray().withMessage("Variants must be an array"),
  body("variants.*.type").optional().trim().notEmpty().withMessage("Variant type cannot be empty"),
  body("attributes").optional().isArray().withMessage("Attributes must be an array"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean"),
  ...variantOptionValidation,
];

const listProductsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("category").optional().isMongoId().withMessage("Invalid category ID"),
  query("brand").optional().isString().withMessage("Brand must be a string"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be >= 0"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be >= 0"),
  query("tags").optional().isString().withMessage("Tags must be a comma-separated string"),
  query("isActive").optional().isIn(["true", "false"]).withMessage("isActive must be true or false"),
  query("isFeatured").optional().isIn(["true", "false"]).withMessage("isFeatured must be true or false"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("sort").optional().isString().withMessage("Sort must be a string"),
  query("fields").optional().isString().withMessage("Fields must be a comma-separated string"),
];

router.get(
  "/",
  ...validate(listProductsValidation),
  productController.getAllProducts
);

router.get(
  "/:id",
  ...validate([param("id").isMongoId().withMessage("Invalid product ID")]),
  productController.getProductById
);

router.post(
  "/",
  ...manageProductAuth,
  ...validate(createProductValidation),
  productController.createProduct
);

router.put(
  "/:id",
  ...manageProductAuth,
  ...validate(updateProductValidation),
  productController.updateProduct
);

router.delete(
  "/:id",
  ...manageProductAuth,
  ...validate([param("id").isMongoId().withMessage("Invalid product ID")]),
  productController.deleteProduct
);

export default router;
