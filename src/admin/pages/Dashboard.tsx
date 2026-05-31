import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CreditCard, ArrowLeftRight, TrendingUp } from "lucide-react";
import { usersApi } from "../api/users";
import { subscriptionsApi } from "../api/subscriptions";
import { transactionsApi } from "../api/transactions";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  completedTransactions: number;
  totalRevenue: number;
  currency: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [users, subscriptions, transactions] = await Promise.all([
          usersApi.list(0, 100),
          subscriptionsApi.list(0, 100),
          transactionsApi.list(0, 100),
        ]);

        const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
        const completedTx = transactions.filter(t => t.status === "completed");
        const totalRevenue = completedTx.reduce((sum, t) => sum + (t.amount ?? 0), 0);
        const currency = completedTx[0]?.currency ?? "ETB";

        setStats({
          totalUsers: users.length,
          activeSubscriptions,
          completedTransactions: completedTx.length,
          totalRevenue,
          currency,
        });
      } catch (err: any) {
        setError(err?.message ?? "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Subscriptions",
      value: stats?.activeSubscriptions,
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Completed Transactions",
      value: stats?.completedTransactions,
      icon: ArrowLeftRight,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: `Total Revenue (${stats?.currency ?? "ETB"})`,
      value: stats ? `${stats.currency} ${stats.totalRevenue.toLocaleString()}` : undefined,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your Questify platform</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {value ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
