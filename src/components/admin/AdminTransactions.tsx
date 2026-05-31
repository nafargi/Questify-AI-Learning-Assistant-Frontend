import { useState, useEffect } from "react";
import { ArrowsClockwise, Spinner, MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService, type AdminTransaction } from "@/services/adminService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const AdminTransactions = () => {
  const [txs, setTxs] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchTxs = async (skip = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getTransactions(skip, PAGE_SIZE);
      setTxs(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTxs(page * PAGE_SIZE); }, [page]);

  const filtered = txs.filter(
    (t) => t.user_id.includes(search) || t.status.includes(search) || (t.provider_reference || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) =>
    s === "completed" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
    : s === "failed" ? "border-red-500/30 text-red-400 bg-red-500/10"
    : "border-amber-500/30 text-amber-400 bg-amber-500/10";

  const totalRevenue = txs.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-slate-400">All payment transactions on the platform</p>
        </div>
        <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => fetchTxs(page * PAGE_SIZE)}>
          <ArrowsClockwise className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: txs.length, color: "text-violet-400" },
          { label: "Completed", value: txs.filter((t) => t.status === "completed").length, color: "text-emerald-400" },
          { label: "Pending", value: txs.filter((t) => t.status === "pending").length, color: "text-amber-400" },
          { label: "Revenue (ETB)", value: totalRevenue.toFixed(2), color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800 p-4">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by user ID, reference, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500" />
      </div>

      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="w-8 h-8 text-violet-400 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Transaction ID", "User ID", "Amount", "Status", "Reference", "Date"].map((h) => (
                    <th key={h} className="text-left text-slate-400 text-xs font-medium uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.transaction_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">{tx.transaction_id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">{tx.user_id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 text-slate-200 font-semibold">{tx.amount} {tx.currency}</td>
                    <td className="px-6 py-4"><Badge variant="outline" className={cn("text-xs", statusColor(tx.status))}>{tx.status}</Badge></td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{tx.provider_reference || "—"}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <p className="text-slate-400 text-sm">Page {page + 1}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-400" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><CaretLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-400" disabled={txs.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}><CaretRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminTransactions;
