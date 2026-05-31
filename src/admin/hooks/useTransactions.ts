import { useState, useEffect, useCallback } from "react";
import { transactionsApi, type AdminTransaction } from "../api/transactions";
import { AdminApiError } from "../api/client";

export function useTransactions(pageSize = 50) {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list(skip, pageSize);
      setTransactions(data);
      setHasMore(data.length === pageSize);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetchTransactions(page * pageSize); }, [page, pageSize, fetchTransactions]);

  return { transactions, loading, error, page, setPage, hasMore, refetch: () => fetchTransactions(page * pageSize) };
}
