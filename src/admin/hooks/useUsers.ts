import { useState, useEffect, useCallback } from "react";
import { usersApi, type AdminUser } from "../api/users";
import { AdminApiError } from "../api/client";

export function useUsers(pageSize = 50) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = useCallback(async (skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list(skip, pageSize);
      setUsers(data);
      setHasMore(data.length === pageSize);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchUsers(page * pageSize);
  }, [page, pageSize, fetchUsers]);

  return { users, loading, error, page, setPage, hasMore, refetch: () => fetchUsers(page * pageSize) };
}

export function useUserDetail(user_id: string) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user_id) return;
    setLoading(true);
    setError(null);
    usersApi.getById(user_id)
      .then(setUser)
      .catch(err => setError(err instanceof AdminApiError ? err.message : "Failed to load user"))
      .finally(() => setLoading(false));
  }, [user_id]);

  return { user, loading, error };
}
