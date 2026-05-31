import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminAuthenticated, isSuperAdmin } from "../api/client";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminProtectedRoute({
  children,
  requireSuperAdmin = false,
}: AdminProtectedRouteProps) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-slate-500 mt-2">
            This section requires Super Admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
