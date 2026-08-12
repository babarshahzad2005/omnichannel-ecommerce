import type { UserRole } from "../models/user/User";

declare module "socket.io" {
  interface SocketData {
    user: {
      id: string;
      role: UserRole;
      email: string;
    };
  }
}

export {};
