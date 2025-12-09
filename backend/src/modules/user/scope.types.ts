// Scope definitions - defined in application code, stored in database as ScopeEntity
export enum ScopeNames {
  INVENTORY_READ = "INVENTORY_READ",
  INVENTORY_WRITE = "INVENTORY_WRITE",
  INVENTORY_DELETE = "INVENTORY_DELETE",
  USER_READ = "USER_READ",
  USER_WRITE = "USER_WRITE",
  USER_DELETE = "USER_DELETE",
  BUSINESS_READ = "BUSINESS_READ",
  BUSINESS_WRITE = "BUSINESS_WRITE",
  BUSINESS_DELETE = "BUSINESS_DELETE",
}

// Scope configuration with descriptions
export const SCOPE_CONFIG: Record<ScopeNames, { name: ScopeNames; description: string }> = {
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
};

export type ScopeId = string;
