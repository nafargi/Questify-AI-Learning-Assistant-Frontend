import { useState, useEffect, useCallback } from "react";
import { plansApi, type Plan, type CreatePlanPayload } from "../api/plans";
import { AdminApiError } from "../api/client";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await plansApi.list();
      setPlans(data);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const create = useCallback(async (payload: CreatePlanPayload): Promise<boolean> => {
    try {
      await plansApi.create(payload);
      await fetchPlans();
      return true;
    } catch { return false; }
  }, [fetchPlans]);

  const update = useCallback(async (plan_id: string, payload: Partial<CreatePlanPayload>): Promise<boolean> => {
    try {
      await plansApi.update(plan_id, payload);
      await fetchPlans();
      return true;
    } catch { return false; }
  }, [fetchPlans]);

  const remove = useCallback(async (plan_id: string): Promise<boolean> => {
    try {
      await plansApi.delete(plan_id);
      await fetchPlans();
      return true;
    } catch { return false; }
  }, [fetchPlans]);

  return { plans, loading, error, create, update, remove, refetch: fetchPlans };
}
