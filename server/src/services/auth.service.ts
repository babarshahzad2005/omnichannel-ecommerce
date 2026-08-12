import bcrypt from "bcryptjs";
import { getRedis } from "../config/redis";
import { User, type IUser, type UserRole } from "../models/user/User";
import { AppError } from "../utils/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type SafeUser = Omit<IUser, "password"> & { _id: IUser["_id"] };

const toSafeUser = (user: IUser): SafeUser => {
  const userObject = user.toObject();
  delete userObject.password;
  return userObject as SafeUser;
};

const storeRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const redis = getRedis();
  const hashedToken = await bcrypt.hash(refreshToken, 12);
  await redis.setEx(`refresh:${userId}`, REFRESH_TOKEN_TTL_SECONDS, hashedToken);
};

const issueTokenPair = async (
  userId: string,
  role: UserRole,
  email: string
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken(userId, role, email);
  const refreshToken = generateRefreshToken(userId);
  await storeRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken };
};

export const register = async (
  data: RegisterInput
): Promise<{ user: SafeUser; tokens: AuthTokens }> => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
  });

  const tokens = await issueTokenPair(
    user._id.toString(),
    user.role,
    user.email
  );

  return {
    user: toSafeUser(user),
    tokens,
  };
};

export const login = async (
  email: string,
  password: string
): Promise<{ user: SafeUser; tokens: AuthTokens }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = await issueTokenPair(user._id.toString(), user.role, user.email);

  return {
    user: toSafeUser(user),
    tokens,
  };
};

export const refreshTokens = async (
  refreshToken: string
): Promise<AuthTokens> => {
  let payload: { id: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const redis = getRedis();
  const storedHash = await redis.get(`refresh:${payload.id}`);

  if (!storedHash) {
    throw new AppError(401, "Refresh token has been revoked");
  }

  const isTokenValid = await bcrypt.compare(refreshToken, storedHash);

  if (!isTokenValid) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.id);

  if (!user || !user.isActive) {
    throw new AppError(401, "User not found or inactive");
  }

  return issueTokenPair(user._id.toString(), user.role, user.email);
};

export const logout = async (userId: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(`refresh:${userId}`);
};

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await User.findById(userId).select("-password");

  if (!user || !user.isActive) {
    throw new AppError(404, "User not found");
  }

  return user.toObject() as SafeUser;
};
