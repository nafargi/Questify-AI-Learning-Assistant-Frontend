import React, { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { StatusBadge } from "../components/StatusBadge";
import { PaginationControls } from "../components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_OPTIONS = ["all", "pending", "completed", "failed", "refunded"];

export default function TransactionsPage() {
  const { transactions, loading, error, page, setPage, hasMore } = useTransactions();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = transactions.filter(t =>
    statusFilter === "all" || t.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-500 mt-1">Payment transaction history</p>
      </div>

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
              <TableHead>Transaction ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(tx => (
                  <TableRow key={tx.transaction_id}>
                    <TableCell className="font-mono text-xs">{tx.transaction_id}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.user_id}</TableCell>
                    <TableCell className="font-medium">{tx.amount?.toLocaleString()}</TableCell>
                    <TableCell>{tx.currency}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
            }
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No transactions found.
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
    </div>
  );
}
