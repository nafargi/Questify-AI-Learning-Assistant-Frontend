import React, { useState } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { usePlans } from "../hooks/usePlans";
import { useUsers } from "../hooks/useUsers";
import { StatusBadge } from "../components/StatusBadge";
import { PaginationControls } from "../components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["all", "active", "expired", "cancelled", "pending"];

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const { subscriptions, loading, error, page, setPage, hasMore, assign } = useSubscriptions();
  const { plans } = usePlans();
  const { users } = useUsers(200);
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const filtered = subscriptions.filter(s =>
    statusFilter === "all" || s.status === statusFilter
  );

  const handleAssign = async () => {
    if (!assignUserId || !assignPlanId) return;
    setAssigning(true);
    const ok = await assign({ user_id: assignUserId, plan_id: assignPlanId });
    setAssigning(false);
    if (ok) {
      toast({ title: "Plan assigned", description: "Subscription created successfully." });
      setAssignOpen(false);
      setAssignUserId("");
      setAssignPlanId("");
    } else {
      toast({ title: "Assignment failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500 mt-1">Manage user subscriptions</p>
        </div>
        <Button onClick={() => setAssignOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Assign Plan
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>User ID</TableHead>
              <TableHead>Plan ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(sub => (
                  <TableRow key={sub.subscription_id}>
                    <TableCell className="font-mono text-xs">{sub.user_id}</TableCell>
                    <TableCell className="font-mono text-xs">{sub.plan_id}</TableCell>
                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sub.started_at ? new Date(sub.started_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
            }
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page} hasMore={hasMore} loading={loading}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
        />
      </div>

      {/* Assign Plan Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan…" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.plan_id} value={p.plan_id}>
                      {p.name} — {p.price} {p.billing_cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignUserId || !assignPlanId || assigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assigning ? "Assigning…" : "Assign Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
