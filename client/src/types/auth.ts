export type UserRole =
  | "superAdmin"
  | "vendorManager"
  | "warehouseStaff"
  | "customer";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
