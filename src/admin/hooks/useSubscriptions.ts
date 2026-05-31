import { useState, useEffect, useCallback } from "react";
import { subscriptionsApi, type AdminSubscription, type AssignSubscriptionPayload } from "../api/subscriptions";
import { AdminApiError } from "../api/client";

export function useSubscriptions(pageSize = 50) {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSubscriptions = useCallback(async (skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionsApi.list(skip, pageSize);
      setSubscriptions(data);
      setHasMore(data.length === pageSize);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchSubscriptions(page * pageSize);
  }, [page, pageSize, fetchSubscriptions]);

  const assign = useCallback(async (payload: AssignSubscriptionPayload): Promise<boolean> => {
    try {
      await subscriptionsApi.assign(payload);
      await fetchSubscriptions(page * pageSize);
      return true;
    } catch {
      return false;
    }
  }, [fetchSubscriptions, page, pageSize]);

  return { subscriptions, loading, error, page, setPage, hasMore, assign, refetch: () => fetchSubscriptions(page * pageSize) };
}
