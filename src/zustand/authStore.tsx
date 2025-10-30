import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  organizationId: string;
  organizationName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  clearAuth: () => void;
  getSessionToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        // Clear session cookie
        document.cookie = "session=; Max-Age=0; path=/; SameSite=Strict";
        set({ user: null, isAuthenticated: false });
      },
      clearAuth: () => {
        // Clear session cookie
        document.cookie = "session=; Max-Age=0; path=/; SameSite=Strict";
        set({ user: null, isAuthenticated: false });
      },
      getSessionToken: () => {
        if (typeof document === "undefined") return null;
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("session="))
          ?.split("=")[1];
        return token || null;
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
