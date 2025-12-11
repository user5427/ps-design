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
  businessId: string;
  userId: string | null;
  ip: string | null;
  entityType: string;
  entityId: string;
  action: AuditActionType | AuditSecurityType;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  createdAt: Date;
}

export interface ICreateAuditBusinessLog {
  businessId: string;
  userId?: string | null;
  ip?: string | null;
  entityType: string;
  entityId: string;
  action: AuditActionType | AuditSecurityType;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  result?: ActionResult;
}

export interface IAuditSecurityLog {
  id: string;
  userId: string | null;
  ip: string | null;
  action: AuditSecurityType;
  createdAt: Date;
}

export interface ICreateAuditSecurityLog {
  userId?: string | null;
  ip?: string | null;
  action: AuditSecurityType;
  result?: ActionResult;
}

export type AuditType = AuditActionType | AuditSecurityType;
