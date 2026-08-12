import type { Server as HttpServer } from "http";
import { Server, type Namespace } from "socket.io";
import type { UserRole } from "../models/user/User";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "./env";

const ADMIN_ROLES: UserRole[] = [
  "superAdmin",
  "vendorManager",
  "warehouseStaff",
];

let io: Server | null = null;
let ordersNamespace: Namespace | null = null;

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, decodeURIComponent(valueParts.join("="))];
    })
  );
};

const extractAccessToken = (handshake: {
  headers: { authorization?: string; cookie?: string };
  auth?: { token?: string };
}): string | null => {
  const authorization = handshake.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  const cookies = parseCookies(handshake.headers.cookie);

  if (cookies.accessToken) {
    return cookies.accessToken;
  }

  if (handshake.auth?.token) {
    return handshake.auth.token;
  }

  return null;
};

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  ordersNamespace = io.of("/orders");

  ordersNamespace.use((socket, next) => {
    try {
      const token = extractAccessToken(socket.handshake);

      if (!token) {
        next(new Error("Authentication required"));
        return;
      }

      const payload = verifyAccessToken(token);

      socket.data.user = {
        id: payload.id,
        role: payload.role,
        email: payload.email,
      };

      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  ordersNamespace.on("connection", (socket) => {
    const { user } = socket.data;

    socket.join(`user:${user.id}`);

    if (ADMIN_ROLES.includes(user.role)) {
      socket.join(`role:${user.role}`);
    }

    console.log(`  Socket connected: ${user.email} (${user.role})`);
  });

  console.log("  Socket.io initialized on /orders namespace");

  return io;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }

  return io;
};

export const getOrdersNamespace = (): Namespace => {
  if (!ordersNamespace) {
    throw new Error("Orders namespace is not initialized");
  }

  return ordersNamespace;
};

export { io };
