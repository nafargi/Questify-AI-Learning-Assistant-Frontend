import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_verified: boolean;
  role: "user" | "support" | "super_admin";
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; unverified?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, otp: string) => Promise<{ error: string | null }>;
  resendOtp: (email: string) => Promise<{ error: string | null }>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("questify-token"));
  const [loading, setLoading] = useState(true);

  // On mount, if token exists fetch profile to hydrate user
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<UserProfile>("/auth/user/profile").then((res) => {
      if (res.success) setUser(res.data);
      else clearAuth();
      setLoading(false);
    }).catch(() => {
      clearAuth();
      setLoading(false);
    });
  }, []);

  function clearAuth() {
    localStorage.removeItem("questify-token");
    localStorage.removeItem("questify-role");
    setToken(null);
    setUser(null);
  }

  function saveToken(t: string) {
    localStorage.setItem("questify-token", t);
    setToken(t);
  }

  const signIn = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: { user_id: string; full_name: string; email: string; role: string } }>(
      "/auth/login",
      { email, password }
    );
    if (!res.success) {
      const unverified = res.message.toLowerCase().includes("not verified");
      return { error: res.message, unverified };
    }
    saveToken(res.data.access_token);
    // Store role for quick access
    if (res.data.user?.role) {
      localStorage.setItem("questify-role", res.data.user.role);
    }
    // Fetch full profile
    const profile = await api.get<UserProfile>("/auth/user/profile");
    if (profile.success) setUser(profile.data);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await api.post("/auth/register", { email, password, full_name: fullName });
    return { error: res.success ? null : res.message };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/auth/verify", { email, otp });
    return { error: res.success ? null : res.message };
  };

  const resendOtp = async (email: string) => {
    const res = await api.post("/auth/resend-otp", { email });
    return { error: res.success ? null : res.message };
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return { error: res.success ? null : res.message };
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await api.post("/auth/reset-password", { email, otp, new_password: newPassword });
    return { error: res.success ? null : res.message };
  };

  const signOut = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      signIn, signUp, verifyOtp, resendOtp,
      forgotPassword, resetPassword, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
