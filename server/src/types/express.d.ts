import type { UserRole } from "../models/user/User";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: UserRole;
      email: string;
    }

    interface Request {
      user?: UserPayload;
    }

    interface Locals {
      redis: import("redis").RedisClientType;
    }
  }
}

export {};
