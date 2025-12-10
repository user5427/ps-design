// Centralized web app navigation URLs
export const URLS = {
  DASHBOARD: "/dashboard",
  LOGIN: "/auth/login",
  CHANGE_PASSWORD: "/auth/change-password",
  HOME: "/",
  // Business Management
  BUSINESS_LIST: "/businesses",
  BUSINESS_CREATE: "/businesses/create",
  BUSINESS_EDIT: (businessId: string) => `/businesses/${businessId}/edit`,
  // Inventory
  INVENTORY_UNITS: "/inventory/units",
  INVENTORY_PRODUCTS: "/inventory/products",
  INVENTORY_STOCK: "/inventory/stock",
  INVENTORY_STOCK_LEVELS: "/inventory/stock-levels",
};
