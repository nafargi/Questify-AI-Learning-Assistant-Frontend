import { adminClient, setAdminSession, clearAdminSession } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    user_id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await adminClient.post<LoginResponse>("/auth/login", payload);
    const data = res.data;

    const role = data.user?.role;
    if (role !== "support" && role !== "super_admin") {
      throw new Error("Access denied: insufficient role");
    }

    setAdminSession({
      token: data.access_token,
      role,
      user_id: data.user.user_id,
    });

    return data;
  },

  logout: () => {
    clearAdminSession();
  },
};
