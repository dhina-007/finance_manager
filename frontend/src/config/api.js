const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

const resolveBaseUrl = () => {
  const fromEnv = process.env.REACT_APP_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    return trimTrailingSlashes(fromEnv.trim());
  }
  return "http://localhost:8080/api/v1";
};

export const API_BASE_URL = resolveBaseUrl();

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
