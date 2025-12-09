// Centralized web app navigation URLs
export const URLS = {
  DASHBOARD: "/dashboard",
  LOGIN: "/auth/login",
  CHANGE_PASSWORD: "/auth/change-password",
  HOME: "/",
  BUSINESS_LIST: "/businesses",
  BUSINESS_CREATE: "/businesses/create",
  BUSINESS_EDIT: (businessId: string) => `/businesses/${businessId}/edit`,
};

