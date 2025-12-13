// Scope definitions - defined in application code, stored in database as ScopeEntity
export enum ScopeNames {
  INVENTORY_READ = "INVENTORY_READ",
  INVENTORY_WRITE = "INVENTORY_WRITE",
  INVENTORY_DELETE = "INVENTORY_DELETE",
  MENU_READ = "MENU_READ",
  MENU_WRITE = "MENU_WRITE",
  MENU_DELETE = "MENU_DELETE",
  USER_READ = "USER_READ",
  USER_WRITE = "USER_WRITE",
  USER_DELETE = "USER_DELETE",
  BUSINESS_READ = "BUSINESS_READ",
  BUSINESS_WRITE = "BUSINESS_WRITE",
  BUSINESS_DELETE = "BUSINESS_DELETE",
  BUSINESS_CREATE = "BUSINESS_CREATE",
  APPOINTMENTS_READ = "APPOINTMENTS_READ",
  APPOINTMENTS_WRITE = "APPOINTMENTS_WRITE",
  APPOINTMENTS_DELETE = "APPOINTMENTS_DELETE",
  GIFT_CARDS_READ = "GIFT_CARDS_READ",
  GIFT_CARDS_WRITE = "GIFT_CARDS_WRITE",
  GIFT_CARDS_DELETE = "GIFT_CARDS_DELETE",
}

// Scope configuration with descriptions
export const SCOPE_CONFIG: Record<
  ScopeNames,
  { name: ScopeNames; description: string }
> = {
  [ScopeNames.INVENTORY_READ]: {
    name: ScopeNames.INVENTORY_READ,
    description: "Read inventory data",
  },
  [ScopeNames.INVENTORY_WRITE]: {
    name: ScopeNames.INVENTORY_WRITE,
    description: "Create and update inventory data",
  },
  [ScopeNames.INVENTORY_DELETE]: {
    name: ScopeNames.INVENTORY_DELETE,
    description: "Delete inventory data",
  },
  [ScopeNames.MENU_READ]: {
    name: ScopeNames.MENU_READ,
    description: "Read menu data",
  },
  [ScopeNames.MENU_WRITE]: {
    name: ScopeNames.MENU_WRITE,
    description: "Create and update menu data",
  },
  [ScopeNames.MENU_DELETE]: {
    name: ScopeNames.MENU_DELETE,
    description: "Delete menu data",
  },
  [ScopeNames.USER_READ]: {
    name: ScopeNames.USER_READ,
    description: "Read user data",
  },
  [ScopeNames.USER_WRITE]: {
    name: ScopeNames.USER_WRITE,
    description: "Create and update user data",
  },
  [ScopeNames.USER_DELETE]: {
    name: ScopeNames.USER_DELETE,
    description: "Delete user data",
  },
  [ScopeNames.BUSINESS_READ]: {
    name: ScopeNames.BUSINESS_READ,
    description: "Read business data",
  },
  [ScopeNames.BUSINESS_WRITE]: {
    name: ScopeNames.BUSINESS_WRITE,
    description: "Create and update business data",
  },
  [ScopeNames.BUSINESS_DELETE]: {
    name: ScopeNames.BUSINESS_DELETE,
    description: "Delete business data",
  },
  [ScopeNames.BUSINESS_CREATE]: {
    name: ScopeNames.BUSINESS_CREATE,
    description: "Create new businesses",
  },
  [ScopeNames.APPOINTMENTS_READ]: {
    name: ScopeNames.APPOINTMENTS_READ,
    description: "Read appointments data",
  },
  [ScopeNames.APPOINTMENTS_WRITE]: {
    name: ScopeNames.APPOINTMENTS_WRITE,
    description: "Create and update appointments data",
  },
  [ScopeNames.APPOINTMENTS_DELETE]: {
    name: ScopeNames.APPOINTMENTS_DELETE,
    description: "Delete appointments data",
  },
  [ScopeNames.GIFT_CARDS_READ]: {
    name: ScopeNames.GIFT_CARDS_READ,
    description: "Read gift cards data",
  },
  [ScopeNames.GIFT_CARDS_WRITE]: {
    name: ScopeNames.GIFT_CARDS_WRITE,
    description: "Create and update gift cards data",
  },
  [ScopeNames.GIFT_CARDS_DELETE]: {
    name: ScopeNames.GIFT_CARDS_DELETE,
    description: "Delete gift cards data",
  },
};

export type ScopeId = string;
