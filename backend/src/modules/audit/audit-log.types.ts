export enum AuditActionType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export enum AuditSecurityType {
  LOGIN = "LOGIN",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET = "PASSWORD_RESET",
}

export enum ActionResult {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

export interface IAuditBusinessLog {
  id: string;
  businessId?: string | null;
  userId: string | null;
  userEmail: string | null;
  ip: string | null;
  entityType: string;
  entityId: string;
  action: AuditActionType;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: Date;
  result: ActionResult | null;
}

export interface ICreateAuditBusinessLog {
  businessId?: string | null;
  userId?: string | null;
  userEmail: string | null;
  ip: string | null;
  entityType: string;
  entityId: string;
  action: AuditActionType;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  result?: ActionResult;
}

export interface IAuditSecurityLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  ip: string | null;
  action: AuditSecurityType;
  createdAt: Date;
  result: ActionResult | null;
}

export interface ICreateAuditSecurityLog {
  userId?: string | null;
  userEmail: string | null;
  ip: string | null;
  action: AuditSecurityType;
  result?: ActionResult;
}

export type AuditType = AuditActionType | AuditSecurityType;
