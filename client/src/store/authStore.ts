import { create } from "zustand";
import api from "../services/api";
import type { ApiResponse, User } from "../types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email, password) => {
    const response = await api.post<ApiResponse<User>>("/auth/login", {
      email,
      password,
    });

    set({
      user: response.data.data ?? null,
      isAuthenticated: Boolean(response.data.data),
      loading: false,
    });
  },

  register: async (name, email, password) => {
    const response = await api.post<ApiResponse<User>>("/auth/register", {
      name,
      email,
      password,
    });

    set({
      user: response.data.data ?? null,
      isAuthenticated: Boolean(response.data.data),
      loading: false,
    });
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  },

  checkAuth: async () => {
    set({ loading: true });

    try {
      const response = await api.get<ApiResponse<User>>("/auth/me");
      set({
        user: response.data.data ?? null,
        isAuthenticated: Boolean(response.data.data),
        loading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },
}));
