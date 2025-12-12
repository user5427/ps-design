import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

const API_BASE_URL = (() => {
  const protocol = import.meta.env.VITE_BACKEND_PROTOCOL;
  const host = import.meta.env.VITE_BACKEND_HOST;
  const port = import.meta.env.VITE_BACKEND_PORT;

  if (protocol && host && port) {
    return `${protocol}://${host}:${port}/api`;
  }

  return import.meta.env.VITE_API_URL;
})();

interface RouterLike {
  state: {
    location: {
      pathname: string;
    };
  };
  navigate: (opts: { to: string }) => void;
}

let routerInstance: RouterLike | null = null;

export function setRouterInstance(router: RouterLike) {
  routerInstance = router;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => {
    cb(token);
  });
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isLoginOrRefresh =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginOrRefresh
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = response.data as { accessToken: string };

        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        isRefreshing = false;
        onRefreshed(accessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        useAuthStore.getState().setAccessToken(null);

        if (
          routerInstance &&
          routerInstance.state.location.pathname !== URLS.LOGIN
        ) {
          routerInstance.navigate({ to: URLS.LOGIN });
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
