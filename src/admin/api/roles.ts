import { adminClient } from "./client";
import type { AdminUser } from "./users";

export type AdminRole = "support" | "super_admin";

export interface PromotePayload {
  user_id: string;
  role: AdminRole;
}

export const rolesApi = {
  promote: async (payload: PromotePayload): Promise<AdminUser> => {
    const res = await adminClient.post<AdminUser>("/admin/promote", payload);
    return res.data;
  },
};
