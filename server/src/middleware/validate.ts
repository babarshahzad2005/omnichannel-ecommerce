import type { NextFunction, Request, Response } from "express";
import { type ValidationChain, validationResult } from "express-validator";
import { error } from "../utils/apiResponse";

export const validate = (rules: ValidationChain[]) => {
  return [
    ...rules,
    (req: Request, res: Response, next: NextFunction): void => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        error(
          res,
          "Validation failed",
          400,
          errors.array().map((err) => ({
            field: "path" in err ? err.path : undefined,
            message: err.msg,
          }))
        );
        return;
      }

      next();
    },
  ];
};
