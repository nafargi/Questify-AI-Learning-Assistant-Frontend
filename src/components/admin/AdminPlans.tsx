import { useState, useEffect } from "react";
import { Plus, Pencil, Trash, ArrowsClockwise, Spinner, Check, X } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminService, type CreatePlanPayload } from "@/services/adminService";
import { type Plan } from "@/services/subscriptionService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_PLAN: CreatePlanPayload = {
  name: "",
  description: "",
  price: 0,
  billing_cycle: "monthly",
  trial_days: 0,
  is_active: true,
  features: [],
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<CreatePlanPayload>(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PLAN); setShowForm(true); };
  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      features: plan.features.map((f) => ({ feature_key: f.feature_key, feature_value: f.feature_value })),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await adminService.updatePlan(editing.plan_id, form);
        toast.success("Plan updated");
      } else {
        await adminService.createPlan(form);
        toast.success("Plan created");
      }
      setShowForm(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    setDeleting(plan.plan_id);
    try {
      await adminService.deletePlan(plan.plan_id);
      toast.success("Plan deleted");
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plans</h1>
          <p className="text-slate-400">Manage subscription plans (super_admin only)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={fetchPlans}>
            <ArrowsClockwise className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Plan
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner className="w-8 h-8 text-violet-400 animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.plan_id} className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                </div>
                <Badge variant="outline" className={cn("text-xs shrink-0", plan.is_active ? "border-emerald-500/30 text-emerald-400" : "border-slate-600 text-slate-500")}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {plan.price === 0 ? "Free" : `${plan.price} ETB`}
                {plan.price > 0 && <span className="text-slate-400 text-sm font-normal">/{plan.billing_cycle === "monthly" ? "mo" : "yr"}</span>}
              </div>
              <ul className="space-y-1">
                {plan.features.map((f) => (
                  <li key={f.feature_id} className="flex items-center gap-2 text-slate-400 text-xs">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    {f.feature_key}: {JSON.stringify(f.feature_value)}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => openEdit(plan)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" disabled={deleting === plan.plan_id} onClick={() => handleDelete(plan)}>
                  {deleting === plan.plan_id ? <Spinner className="w-3 h-3 animate-spin" /> : <Trash className="w-3 h-3" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">{editing ? "Edit Plan" : "New Plan"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-200" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Price (ETB)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Trial Days</Label>
                <Input type="number" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Billing Cycle</Label>
                <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as "monthly" | "yearly" })} className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-1 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-violet-500" />
                  <span className="text-slate-300 text-sm">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-slate-300" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" disabled={saving} onClick={handleSave}>
                {saving ? <Spinner className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
