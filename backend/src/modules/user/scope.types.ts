// Scope definitions - defined in application code, stored in database as ScopeEntity
export enum ScopeNames {
  SUPERADMIN = "SUPERADMIN",
  INVENTORY = "INVENTORY",
  MENU = "MENU",
  CATEGORIES = "CATEGORIES",
  USER = "USER",
  ROLE = "ROLE",
  BUSINESS = "BUSINESS",
  APPOINTMENTS = "APPOINTMENTS",
  GIFT_CARDS = "GIFT_CARDS",
  SERVICE_DISCOUNTS = "SERVICE_DISCOUNTS",
  MENU_DISCOUNTS = "MENU_DISCOUNTS",
  ORDERS = "ORDERS",
  TAX = "TAX",
  AUDIT_BUSINESS = "AUDIT_BUSINESS",
  AUDIT_SECURITY = "AUDIT_SECURITY",
}

// Scope configuration with descriptions
export const SCOPE_CONFIG: Record<
  ScopeNames,
  {
    name: ScopeNames;
    description: string;
    businessType?: "order" | "appointment";
  }
> = {
  [ScopeNames.SUPERADMIN]: {
    name: ScopeNames.SUPERADMIN,
    description: "Super administrator with full system access",
  },
  [ScopeNames.INVENTORY]: {
    name: ScopeNames.INVENTORY,
    description:
      "Full access to inventory management (read, create, update, delete)",
    businessType: "order",
  },
  [ScopeNames.MENU]: {
    name: ScopeNames.MENU,
    description:
      "Full access to menu management (read, create, update, delete)",
    businessType: "order",
  },
  [ScopeNames.CATEGORIES]: {
    name: ScopeNames.CATEGORIES,
    description:
      "Full access to category management (read, create, update, delete)",
    businessType: "order",
  },
  [ScopeNames.USER]: {
    name: ScopeNames.USER,
    description:
      "Full access to user management (read, create, update, delete)",
  },
  [ScopeNames.ROLE]: {
    name: ScopeNames.ROLE,
    description:
      "Full access to role management (read, create, update, delete)",
  },
  [ScopeNames.BUSINESS]: {
    name: ScopeNames.BUSINESS,
    description:
      "Full access to business management (read, create, update, delete)",
  },
  [ScopeNames.APPOINTMENTS]: {
    name: ScopeNames.APPOINTMENTS,
    description:
      "Full access to appointments management (read, create, update, delete)",
    businessType: "appointment",
  },
  [ScopeNames.GIFT_CARDS]: {
    name: ScopeNames.GIFT_CARDS,
    description:
      "Full access to gift cards management (read, create, update, delete)",
  },
  [ScopeNames.SERVICE_DISCOUNTS]: {
    name: ScopeNames.SERVICE_DISCOUNTS,
    description:
      "Full access to service discounts management (read, create, update, delete)",
    businessType: "appointment",
  },
  [ScopeNames.MENU_DISCOUNTS]: {
    name: ScopeNames.MENU_DISCOUNTS,
    description:
      "Full access to menu discounts management (read, create, update, delete)",
    businessType: "order",
  },
  [ScopeNames.ORDERS]: {
    name: ScopeNames.ORDERS,
    description: "Full access to restaurant orders (read, create, update)",
    businessType: "order",
  },
  [ScopeNames.TAX]: {
    name: ScopeNames.TAX,
    description: "Full access to tax management (read, create, update, delete)",
  },
  [ScopeNames.AUDIT_BUSINESS]: {
    name: ScopeNames.AUDIT_BUSINESS,
    description: "Read access to business audit logs",
  },
  [ScopeNames.AUDIT_SECURITY]: {
    name: ScopeNames.AUDIT_SECURITY,
    description: "Read access to security audit logs",
  },
};

export type ScopeId = string;
