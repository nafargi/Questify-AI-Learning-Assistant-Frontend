const BASE_URL = "http://localhost:8000/api";

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

function getToken(): string | null {
  return localStorage.getItem("questify-token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  return json as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  postForm: <T>(path: string, form: FormData) => request<T>("POST", path, form, true),
  putForm: <T>(path: string, form: FormData) => request<T>("PUT", path, form, true),
};
