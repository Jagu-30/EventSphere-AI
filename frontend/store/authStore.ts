import { create } from "zustand";

interface UserProfile {
  id: number;
  name: str;
  email: str;
  role: "customer" | "organizer" | "admin";
  is_active: boolean;
  is_verified: boolean;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const API_BASE = "http://localhost:8000/api";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  initialize: async () => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      set({ token: storedToken, isAuthenticated: true });
      try {
        await get().fetchUser();
      } catch (err) {
        get().logout();
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      
      await get().fetchUser();
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      // Auto login after registration
      set({ loading: false });
      return await get().login(email, password);
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await response.json();
      set({ user: userProfile });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
