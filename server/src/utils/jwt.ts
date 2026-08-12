import jwt from "jsonwebtoken";
import type { UserRole } from "../models/user/User";

interface AccessTokenPayload {
  id: string;
  role: UserRole;
  email: string;
}

interface RefreshTokenPayload {
  id: string;
}

export const generateAccessToken = (
  id: string,
  role: UserRole,
  email: string
): string => {
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  } as jwt.SignOptions);
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
};
