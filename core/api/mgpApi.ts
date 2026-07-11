import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import axios, { isAxiosError } from "axios";
import { Platform } from "react-native";

const STAGE = process.env.EXPO_PUBLIC_STAGE || "dev";

export const API_URL =
  STAGE === "prod"
    ? process.env.EXPO_PUBLIC_API_URL
    : Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_API_URL_IOS
      : process.env.EXPO_PUBLIC_API_URL_ANDROID;

const mgpApi = axios.create({
  baseURL: API_URL,
});

mgpApi.interceptors.request.use(async (config) => {
  if (config.url?.includes("/auth/login")) {
    return config;
  }

  const token = await SecureStorageAdapter.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

mgpApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      // Import dinámico para evitar el ciclo mgpApi.ts -> useAuthStore.ts -> auth-actions.ts -> mgpApi.ts
      const { useAuthStore } =
        await import("@/presentation/auth/store/useAuthStore");
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export { mgpApi };
