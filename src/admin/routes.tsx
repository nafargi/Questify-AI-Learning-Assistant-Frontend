import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { isAdminAuthenticated, isSuperAdmin } from "./api/client";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load all pages for code splitting
const Login        = lazy(() => import("./pages/Login"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const Users        = lazy(() => import("./pages/Users"));
const UserDetail   = lazy(() => import("./pages/UserDetail"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Plans        = lazy(() => import("./pages/Plans"));
const Transactions = lazy(() => import("./pages/Transactions"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  if (!isSuperAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-500">This section requires Super Admin privileges.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public admin login — redirects if already authenticated */}
        <Route
          path="login"
          element={
            isAdminAuthenticated()
              ? <Navigate to="/admin" replace />
              : <Login />
          }
        />

        {/* Protected admin layout */}
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="transactions" element={<Transactions />} />
          <Route
            path="plans"
            element={
              <SuperAdminOnly>
                <Plans />
              </SuperAdminOnly>
            }
          />
          <Route
            path="roles"
            element={
              <SuperAdminOnly>
                <RoleManagement />
              </SuperAdminOnly>
            }
          />
          {/* Catch-all inside admin — redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
