import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  ArrowLeftRight,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { authApi } from "../api/auth";
import { isSuperAdmin, getAdminRole } from "../api/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ALL_NAV = [
  { label: "Dashboard",      path: "/admin",               icon: LayoutDashboard, superAdminOnly: false },
  { label: "Users",          path: "/admin/users",          icon: Users,           superAdminOnly: false },
  { label: "Subscriptions",  path: "/admin/subscriptions",  icon: CreditCard,      superAdminOnly: false },
  { label: "Transactions",   path: "/admin/transactions",   icon: ArrowLeftRight,  superAdminOnly: false },
  { label: "Plans",          path: "/admin/plans",          icon: Package,         superAdminOnly: true  },
  { label: "Role Management",path: "/admin/roles",          icon: ShieldCheck,     superAdminOnly: true  },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const superAdmin = isSuperAdmin();
  const role = getAdminRole();

  const navItems = ALL_NAV.filter(item => !item.superAdminOnly || superAdmin);

  const handleLogout = () => {
    authApi.logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg tracking-tight">Questify Admin</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 capitalize">
          Role: <span className="font-medium text-slate-200">{role ?? "—"}</span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <Separator className="mb-3 bg-slate-700" />
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
