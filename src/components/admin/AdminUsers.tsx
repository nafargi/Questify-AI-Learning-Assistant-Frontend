import { useState, useEffect } from "react";
import {
  MagnifyingGlass, DotsThreeVertical, Shield, CaretLeft, CaretRight,
  Eye, ArrowsClockwise, Spinner
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminService, type AdminUser } from "@/services/adminService";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [promoting, setPromoting] = useState<string | null>(null);

  const fetchUsers = async (skip = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(skip, PAGE_SIZE);
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page * PAGE_SIZE);
  }, [page]);

  const handlePromote = async (user: AdminUser, role: "support" | "super_admin") => {
    setPromoting(user.user_id);
    try {
      await adminService.promoteUser(user.user_id, role);
      toast.success(`${user.full_name} promoted to ${role}`);
      fetchUsers(page * PAGE_SIZE);
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user");
    } finally {
      setPromoting(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage all platform users and roles</p>
        </div>
        <Button
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          onClick={() => fetchUsers(page * PAGE_SIZE)}
        >
          <ArrowsClockwise className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Loaded", value: users.length, color: "text-violet-400" },
          { label: "Verified", value: users.filter((u) => u.is_verified).length, color: "text-emerald-400" },
          { label: "Admins", value: users.filter((u) => u.role !== "user").length, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800 p-4">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
        />
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {["User", "Role", "Verified", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left text-slate-400 text-xs font-medium uppercase tracking-wider px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                          <span className="text-white font-medium text-sm">
                            {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{user.full_name}</p>
                          <p className="text-slate-500 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          user.role === "super_admin"
                            ? "border-red-500/30 text-red-400 bg-red-500/10"
                            : user.role === "support"
                            ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                            : "border-slate-600 text-slate-400"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`w-2 h-2 rounded-full inline-block mr-2 ${user.is_verified ? "bg-emerald-400" : "bg-slate-500"}`} />
                      <span className={`text-sm ${user.is_verified ? "text-emerald-400" : "text-slate-500"}`}>
                        {user.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-slate-700 rounded-lg transition-all">
                            {promoting === user.user_id ? (
                              <Spinner className="w-4 h-4 text-slate-400 animate-spin" />
                            ) : (
                              <DotsThreeVertical className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                            onClick={() => handlePromote(user, "support")}
                          >
                            <Shield className="w-4 h-4 mr-2" /> Promote to Support
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-amber-400 hover:bg-slate-700 cursor-pointer"
                            onClick={() => handlePromote(user, "super_admin")}
                          >
                            <Shield className="w-4 h-4 mr-2" /> Promote to Super Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <p className="text-slate-400 text-sm">Page {page + 1}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-400"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <CaretLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-400"
              disabled={users.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              <CaretRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
