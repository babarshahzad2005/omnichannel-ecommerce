import type { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { ApiError } from "../utils/ApiError";

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
  details?: unknown;
}

export const errorHandler = (
  err: ErrorWithStatusCode,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    const firstError = Object.values(err.errors)[0];
    message = firstError?.message ?? "Validation failed";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err instanceof ApiError || err.statusCode) {
    statusCode = err.statusCode ?? 500;
    message = err.message;
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  const body: { success: false; message: string; error?: unknown } = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    body.error =
      err instanceof ApiError && err.details !== undefined
        ? err.details
        : err;
  }

  res.status(statusCode).json(body);
};
