import React, { useState } from "react";
import { usePlans } from "../hooks/usePlans";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plan, CreatePlanPayload } from "../api/plans";

const EMPTY_PLAN: CreatePlanPayload = {
  name: "",
  description: "",
  price: 0,
  billing_cycle: "monthly",
  trial_days: 0,
  is_active: true,
  features: [],
};

export default function PlansPage() {
  const { toast } = useToast();
  const { plans, loading, error, create, update, remove } = usePlans();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreatePlanPayload>(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(EMPTY_PLAN);
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      features: plan.features.map(f => ({ feature_key: f.feature_key, feature_value: f.feature_value })),
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let ok: boolean;
    if (editingPlan) {
      ok = await update(editingPlan.plan_id, form);
    } else {
      ok = await create(form);
    }
    setSaving(false);
    if (ok) {
      toast({ title: editingPlan ? "Plan updated" : "Plan created" });
      setFormOpen(false);
    } else {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await remove(deleteTarget.plan_id);
    setDeleting(false);
    if (ok) {
      toast({ title: "Plan deleted" });
      setDeleteTarget(null);
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Plans</h1>
          <p className="text-slate-500 mt-1">Manage subscription plans</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Plan
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent><Skeleton className="h-16 w-full" /></CardContent>
              </Card>
            ))
          : plans.map(plan => (
              <Card key={plan.plan_id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    {plan.is_active && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-slate-500 capitalize">{plan.billing_cycle}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Trial: {plan.trial_days} days
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="text-xs text-slate-500 space-y-0.5">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="truncate">• {f.feature_key}</li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-slate-400">+{plan.features.length - 3} more</li>
                      )}
                    </ul>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(plan)} className="flex-1">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => setDeleteTarget(plan)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pro Monthly" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billing_cycle} onValueChange={v => setForm(f => ({ ...f, billing_cycle: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trial Days</Label>
                <Input type="number" min={0} value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Plan"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
