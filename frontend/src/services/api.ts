import axios from "axios";
import type { WardFeature, WardGeoJSON } from "../types/ward";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getAllWards(): Promise<WardGeoJSON> {
  const response = await api.get<WardGeoJSON>("/api/wards");
  return response.data;
}

export async function getWard(
  wardId: number
): Promise<WardFeature> {
  const response = await api.get<WardFeature>(`/api/wards/${wardId}`);
  return response.data;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await api.get("/health");
    return response.data?.status === "healthy";
  } catch {
    return false;
  }
}

export default api;