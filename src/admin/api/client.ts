// ─── Admin API Client ────────────────────────────────────────────────────────
// Standalone admin HTTP client. Token stored in module-level memory only.
// Never touches the main app token in localStorage.

const BASE_URL = "http://localhost:8000/api";

// In-memory token — not persisted to localStorage
let _adminToken: string | null = null;
let _adminRole: string | null = null;
let _adminUserId: string | null = null;

export interface AdminTokenPayload {
  token: string;
  role: string;
  user_id: string;
}

export function setAdminSession(payload: AdminTokenPayload): void {
  _adminToken = payload.token;
  _adminRole = payload.role;
  _adminUserId = payload.user_id;
}

export function clearAdminSession(): void {
  _adminToken = null;
  _adminRole = null;
  _adminUserId = null;
}

export function getAdminToken(): string | null {
  return _adminToken;
}

export function getAdminRole(): string | null {
  return _adminRole;
}

export function getAdminUserId(): string | null {
  return _adminUserId;
}

export function isAdminAuthenticated(): boolean {
  return _adminToken !== null && (_adminRole === "support" || _adminRole === "super_admin");
}

export function isSuperAdmin(): boolean {
  return _adminRole === "super_admin";
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

// ─── Core Request ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<ApiResponse<T>> {
  const token = _adminToken;
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData
        ? (body as FormData)
        : body
        ? JSON.stringify(body)
        : undefined,
    });
  } catch {
    throw new AdminApiError(0, "Cannot reach server");
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new AdminApiError(res.status, `HTTP ${res.status}`);
  }

  if (res.status === 401) {
    clearAdminSession();
    throw new AdminApiError(401, "Unauthorized — please log in again");
  }
  if (res.status === 403) throw new AdminApiError(403, "Access denied");
  if (res.status === 404) throw new AdminApiError(404, "Not found");
  if (res.status >= 500) throw new AdminApiError(res.status, "Server error");

  if (!json.success) {
    throw new AdminApiError(res.status, json.message ?? "Unknown error");
  }

  return json;
}

export const adminClient = {
  get:    <T>(path: string) => request<T>("GET", path),
  post:   <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put:    <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
