// Centralized web app navigation URLs
export const URLS = {
  DASHBOARD: "/dashboard",
  AVAILABILITY: "/availability",
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
  // Categories (unified for menu and services)
  CATEGORIES: "/categories",
  // Menu
  MENU_ITEMS: "/menu/items",
  // Appointments
  APPOINTMENTS_SERVICE_DEFINITIONS: "/appointments/service-definitions",
  APPOINTMENTS_STAFF_SERVICES: "/appointments/staff-services",
  APPOINTMENTS_LIST: "/appointments/appointments",
  GIFT_CARDS: "/gift-cards",
};
