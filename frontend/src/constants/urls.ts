// Centralized web app navigation URLs
export const URLS = {
  DASHBOARD: "/dashboard",
  AVAILABILITY: "/availability",
  FLOOR_PLAN: "/floor-plan",
  LOGIN: "/auth/login",
  CHANGE_PASSWORD: "/auth/change-password",
  HOME: "/",
  // Manage
  MANAGE_BUSINESSES: "/manage/businesses",
  MANAGE_USERS: "/manage/users",
  MANAGE_ROLES: "/manage/roles",
  // Inventory
  INVENTORY_UNITS: "/inventory/units",
  INVENTORY_PRODUCTS: "/inventory/products",
  INVENTORY_STOCK: "/inventory/stock",
  INVENTORY_STOCK_LEVELS: "/inventory/stock-levels",
  // Categories (unified for menu and services)
  CATEGORIES: "/categories",
  // Menu
  MENU_ITEMS: "/menu/items",
  // Orders
  ORDER_VIEW: (orderId: string) => `/orders/${orderId}`,
  // Appointments
  APPOINTMENTS_SERVICE_DEFINITIONS: "/appointments/service-definitions",
  APPOINTMENTS_STAFF_SERVICES: "/appointments/staff-services",
  APPOINTMENTS_LIST: "/appointments/appointments",
  GIFT_CARDS: "/gift-cards",
  DISCOUNTS: "/discounts",
  DISCOUNTS_SERVICES: "/discounts/services",
  DISCOUNTS_MENU: "/discounts/menu",
  // Audit Logs
  AUDIT_BUSINESS_LOGS: "/audit/business-logs",
  AUDIT_SECURITY_LOGS: "/audit/security-logs",
  // Tax
  TAX: "/tax",
};
