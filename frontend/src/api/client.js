const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token"); // simple approach for now

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    // you can add more sophisticated error handling later
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.message || "API error");
    error.status = res.status;
    throw error;
  }
  return res.json();
}
