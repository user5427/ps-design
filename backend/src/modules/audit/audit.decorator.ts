import type { AuditLogService } from "../audit/audit-log.service";
import {
  AuditActionType,
  type AuditSecurityType,
  type AuditType,
  ActionResult,
} from "../audit/audit-log.types";

export function auditActionWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  auditLogService: AuditLogService,
  action: AuditActionType,
  entityType: string,
  businessId: string,
  userId: string,
  entityId: string,
  ip: string | null,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {

    const oldValues =
      action === AuditActionType.CREATE
        ? null
        : await auditLogService.getEntitySnapshot(entityType, entityId);
    let result: ActionResult = ActionResult.FAILURE;
    try {
      const res = await fn(...args);
      result = ActionResult.SUCCESS;
      return res;
    } finally {
      const newValues = await auditLogService.getEntitySnapshot(
        entityType,
        entityId,
      );
      await auditLogService.logBusiness({
        businessId,
        userId,
        ip: ip ?? null,
        entityType,
        entityId,
        action,
        oldValues: oldValues ?? null,
        newValues: newValues ?? null,
        result,
      });
    }
  };
}

export function auditSecurityWrapper<
  T extends (...args: any[]) => Promise<any>,
>(
  fn: T,
  auditLogService: AuditLogService,
  action: AuditSecurityType,
  userId: string,
  ip: string | null,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    let result: ActionResult = ActionResult.FAILURE;
    try {
      const res = await fn(...args);
      result = ActionResult.SUCCESS;
      return res;
    } finally {
      await auditLogService.logSecurity({
        userId,
        ip,
        action,
        result,
      });
    }
  };
}

export function auditLogWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  auditLogService: AuditLogService,
  auditType: AuditType,
  params: {
    entityType?: string;
    businessId?: string;
    entityId?: string;
    userId: string;
    ip: string | null;
  },
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  if (Object.values(AuditActionType).includes(auditType as AuditActionType)) {
    if (!params.entityType || !params.businessId || !params.entityId) {
      throw new Error(
        "Business action requires entityType, businessId, and entityId",
      );
    }
    return auditActionWrapper(
      fn,
      auditLogService,
      auditType as AuditActionType,
      params.entityType,
      params.businessId,
      params.userId,
      params.entityId,
      params.ip,
    );
  } else {
    return auditSecurityWrapper(
      fn,
      auditLogService,
      auditType as AuditSecurityType,
      params.userId,
      params.ip,
    );
  }
}
