import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../hooks/useUsers";
import { StatusBadge } from "../components/StatusBadge";
import { PaginationControls } from "../components/PaginationControls";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function UsersPage() {
  const navigate = useNavigate();
  const { users, loading, error, page, setPage, hasMore } = useUsers();
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    search === "" ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">All registered users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(user => (
                  <TableRow
                    key={user.user_id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/admin/users/${user.user_id}`)}
                  >
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.is_verified ? "verified" : "unverified"} />
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
            }
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          hasMore={hasMore}
          loading={loading}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
        />
      </div>
    </div>
  );
}
