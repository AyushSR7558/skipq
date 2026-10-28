import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("skipq_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("skipq_token");
      localStorage.removeItem("skipq_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
