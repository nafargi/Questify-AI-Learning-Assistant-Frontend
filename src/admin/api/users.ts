import { adminClient } from "./client";

export interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_deleted: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  list: async (skip = 0, limit = 50): Promise<AdminUser[]> => {
    const res = await adminClient.get<AdminUser[]>(
      `/admin/users?skip=${skip}&limit=${limit}`
    );
    return res.data;
  },

  getById: async (user_id: string): Promise<AdminUser> => {
    const res = await adminClient.get<AdminUser>(`/admin/users/${user_id}`);
    return res.data;
  },
};
