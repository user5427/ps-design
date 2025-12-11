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
  businessId: string | null,
  userId: string,
  entityId: string | null, // allow null for CREATE
  ip: string | null,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let oldValues = null;

    // Only fetch oldValues for UPDATE/DELETE
    if (action !== AuditActionType.CREATE && entityId) {
      oldValues = await auditLogService.getEntitySnapshot(entityType as any, entityId);
    }

    let result: ActionResult = ActionResult.FAILURE;
    let res: Awaited<ReturnType<T>>;
    let finalEntityId = entityId;

    try {
      // Call the real function
      res = await fn(...args);

      // If CREATE: extract ID from response
      if (action === AuditActionType.CREATE) {
        finalEntityId = res.id; // adjust to your return shape
      }

      result = ActionResult.SUCCESS;
    } finally {
      const newValues = finalEntityId
        ? await auditLogService.getEntitySnapshot(entityType as any, finalEntityId)
        : null;

      if (!newValues) {
        throw new Error("Failed to retrieve new values for audit log with entityId: " + finalEntityId + " and entityType: " + entityType);
      }

      await auditLogService.logBusiness({
        businessId,
        userId,
        ip,
        entityType,
        entityId: finalEntityId!,
        action,
        oldValues,
        newValues,
        result,
      });
    }

    return res;
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
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
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
    businessId?: string | null;
    entityId?: string | null;
    userId: string;
    ip: string | null;
  },
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {

  const isBusinessAction =
    Object.values(AuditActionType).includes(auditType as AuditActionType);

  if (isBusinessAction) {
    const action = auditType as AuditActionType;

    // ✅ CREATE should NOT require businessId or entityId
    if (action === AuditActionType.CREATE) {
      if (!params.entityType) {
        throw new Error("CREATE requires entityType");
      }

      return auditActionWrapper(
        fn,
        auditLogService,
        action,
        params.entityType,
        params.businessId ?? null, // not used for CREATE
        params.userId,
        null,                    // entityId is null for CREATE
        params.ip,
      );
    }

    // ❗ For UPDATE or DELETE: these 3 must be present
    if (!params.entityType || !params.businessId || !params.entityId) {
      throw new Error(
        "UPDATE/DELETE action requires entityType, businessId, and entityId",
      );
    }

    return auditActionWrapper(
      fn,
      auditLogService,
      action,
      params.entityType,
      params.businessId,
      params.userId,
      params.entityId,
      params.ip,
    );
  }

  // Security logs
  return auditSecurityWrapper(
    fn, auditLogService, auditType as AuditSecurityType, params.userId, params.ip
  );
}

