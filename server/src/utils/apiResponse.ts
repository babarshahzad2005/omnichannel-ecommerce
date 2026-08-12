import type { Response } from "express";

export const success = (
  res: Response,
  data: unknown,
  statusCode = 200
): void => {
  res.status(statusCode).json({ success: true, data });
};

export const error = (
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown
): void => {
  const body: { success: false; message: string; details?: unknown } = {
    success: false,
    message,
  };

  if (details !== undefined) {
    body.details = details;
  }

  res.status(statusCode).json(body);
};
