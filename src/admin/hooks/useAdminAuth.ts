import { useState, useCallback } from "react";
import { authApi, type LoginPayload } from "../api/auth";
import {
  isAdminAuthenticated,
  isSuperAdmin,
  getAdminRole,
  getAdminUserId,
  clearAdminSession,
  AdminApiError,
} from "../api/client";

export function useAdminAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (payload: LoginPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login(payload);
      return true;
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
  }, []);

  return {
    login,
    logout,
    loading,
    error,
    isAuthenticated: isAdminAuthenticated(),
    isSuperAdmin: isSuperAdmin(),
    role: getAdminRole(),
    userId: getAdminUserId(),
  };
}
