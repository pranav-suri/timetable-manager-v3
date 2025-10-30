import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type UserState = {
  id: string;
  token: string;
  isAuthenticated: boolean;
  email: string;
  name: string;
  onboarded: boolean;
};

type UserActions = {
  setUser: (user: UserState) => void;
  logout: () => void;
};

const initialState: UserState = {
  id: "",
  token: "",
  isAuthenticated: false,
  email: "",
  name: "",
  onboarded: true,
};

export const useUserStore = create<UserState & UserActions>()(
  devtools(
    // access info via Redux DevTools
    persist(
      // persist the state in local storage
      (set) => ({
        ...initialState,
        setUser: (user: UserState) => set((state) => ({ ...state, ...user })),
        logout: () => {
          set(initialState);
          localStorage.removeItem("token");
        },
      }),
      {
        name: "user-storage",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
