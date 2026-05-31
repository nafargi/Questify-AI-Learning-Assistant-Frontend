import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserDetail } from "../hooks/useUsers";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Calendar, Shield, CheckCircle, XCircle } from "lucide-react";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading, error } = useUserDetail(id ?? "");

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </Button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/users")} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {loading ? <Skeleton className="h-8 w-48 inline-block" /> : (user?.full_name || "Unknown User")}
        </h1>
        <p className="text-slate-500 mt-1">User profile and details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : user ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <StatusBadge status={user.role} />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {user.is_verified
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-slate-600">
                    Email {user.is_verified ? "verified" : "not verified"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : user ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">User ID</span>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                    {user.user_id}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Account status</span>
                  <StatusBadge status={user.is_deleted ? "deleted" : "active"} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Last updated</span>
                  <span className="text-slate-600">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
