import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { verifyAccessToken } from "../utils/jwt";
import { cartSessionCookieOptions } from "../utils/cookies";

declare global {
  namespace Express {
    interface Request {
      cartKey?: string;
      guestSessionId?: string;
    }
  }
}

export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.accessToken;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

export const resolveCartIdentity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    req.cartKey = req.user.id;
    next();
    return;
  }

  let guestSessionId = req.cookies?.cartSession as string | undefined;

  if (!guestSessionId) {
    guestSessionId = randomUUID();
    res.cookie("cartSession", guestSessionId, cartSessionCookieOptions);
  }

  req.guestSessionId = guestSessionId;
  req.cartKey = guestSessionId;
  next();
};
