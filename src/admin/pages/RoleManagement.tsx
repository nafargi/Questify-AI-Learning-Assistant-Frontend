import React, { useState } from "react";
import { usersApi } from "../api/users";
import { rolesApi, type AdminRole } from "../api/roles";
import { getAdminUserId } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AdminUser } from "../api/users";

export default function RoleManagementPage() {
  const { toast } = useToast();
  const myUserId = getAdminUserId();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<AdminUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<AdminRole>("support");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const users = await usersApi.list(0, 200);
      const found = users.find(
        (u) => u.email.toLowerCase() === searchEmail.trim().toLowerCase()
      );
      if (!found) {
        setSearchError("No user found with that email address.");
      } else {
        setSearchResult(found);
      }
    } catch (err: any) {
      setSearchError(err?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async () => {
    if (!searchResult) return;
    setPromoting(true);
    try {
      await rolesApi.promote({ user_id: searchResult.user_id, role: targetRole });
      toast({
        title: "Role updated",
        description: `${searchResult.full_name} is now ${targetRole}.`,
      });
      setConfirmOpen(false);
      setSearchResult((prev) => (prev ? { ...prev, role: targetRole } : null));
    } catch (err: any) {
      toast({
        title: "Promotion failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
    }
  };

  const isSelf = searchResult?.user_id === myUserId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
        <p className="text-slate-500 mt-1">Promote users to admin roles</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Find User by Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-search-email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="role-search-email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={searching}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchEmail.trim()}
              >
                {searching ? "Searching…" : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {searchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{searchResult.full_name}</span>
                  <StatusBadge status={searchResult.role} />
                </div>
                <div className="text-sm text-slate-500">{searchResult.email}</div>
              </div>

              {isSelf && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  You cannot change your own role.
                </div>
              )}

              {!isSelf && (
                <>
                  <div className="space-y-2">
                    <Label>Assign Role</Label>
                    <Select
                      value={targetRole}
                      onValueChange={(v) => setTargetRole(v as AdminRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">support</SelectItem>
                        <SelectItem value="super_admin">super_admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Promote to {targetRole}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Role Change"
        description={`Promote ${searchResult?.full_name} (${searchResult?.email}) to "${targetRole}"? This gives them elevated system access.`}
        confirmLabel="Promote"
        loading={promoting}
        onConfirm={handlePromote}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
