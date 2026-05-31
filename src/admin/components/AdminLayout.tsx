import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { isAdminAuthenticated } from "../api/client";
import { Toaster } from "@/components/ui/toaster";

export function AdminLayout() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
