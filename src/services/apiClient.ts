// Axios-compatible client using native fetch — used by authService.ts
const BASE_URL = "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("questify-token") || localStorage.getItem("access_token");
}

async function request(method: string, url: string, body?: unknown, options: any = {}) {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  // Strip leading /api if url already starts with /api (authService passes full paths)
  const path = url.startsWith("/api") ? url.slice(4) : url;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    ...options.responseType === "blob" ? {} : {},
  });

  if (options.responseType === "blob") {
    if (!res.ok) throw { response: { status: res.status, data: {} } };
    const blob = await res.blob();
    return { status: res.status, headers: { "content-type": res.headers.get("content-type") }, data: blob };
  }

  const json = await res.json();
  if (!json.success) {
    const err: any = new Error(json.message);
    err.response = { status: res.status, data: json };
    throw err;
  }
  // Wrap in axios-style envelope: { data: apiResponse }
  return { status: res.status, data: json };
}

const apiClient = {
  get:    (url: string, options?: any) => request("GET", url, undefined, options),
  post:   (url: string, body?: unknown) => request("POST", url, body),
  patch:  (url: string, body?: unknown) => request("PATCH", url, body),
  put:    (url: string, body?: unknown) => request("PUT", url, body),
  delete: (url: string) => request("DELETE", url),
};

export default apiClient;
