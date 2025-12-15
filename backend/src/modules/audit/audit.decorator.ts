import type { AuditLogService, EntityName } from "../audit/audit-log.service";
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
  entityType: EntityName,
  businessId: string | null,
  userId: string,
  entityIds: string | string[] | null,
  ip: string | null,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const ids = Array.isArray(entityIds)
      ? entityIds
      : entityIds
        ? [entityIds]
        : [];

    // Fetch old snapshots
    const oldValuesMap: Record<string, Record<string, unknown> | null> = {};
    if (action !== AuditActionType.CREATE && ids.length) {
      await Promise.all(
        ids.map(async (id) => {
          oldValuesMap[id] = await auditLogService.getEntitySnapshot(
            entityType,
            id,
          );
        }),
      );
    }

    let result: ActionResult = ActionResult.FAILURE;
    let res: Awaited<ReturnType<T>>;
    let finalIds = ids;

    try {
      res = (await fn(...args)) as Awaited<ReturnType<T>>;

      // For CREATE, the returned entity (or entities) provide new IDs
      if (action === AuditActionType.CREATE) {
        if (Array.isArray(res)) {
          finalIds = (res as { id: string }[]).map((r) => r.id);
        } else {
          finalIds = [(res as { id: string }).id];
        }
      }

      result = ActionResult.SUCCESS;
    } finally {
      try {
        await Promise.all(
          finalIds.map(async (id) => {
            const newValues = await auditLogService.getEntitySnapshot(
              entityType,
              id,
            );
            await auditLogService.logBusiness({
              businessId,
              userId,
              ip,
              entityType,
              entityId: id,
              action,
              oldValues: oldValuesMap[id] ?? null,
              newValues,
              result,
            });
          }),
        );
      } catch {
        // Handle logging error silently
      }
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
      const res = (await fn(...args)) as Awaited<ReturnType<T>>;
      result = ActionResult.SUCCESS;
      return res;
    } finally {
      try {
        await auditLogService.logSecurity({
          userId,
          ip,
          action,
          result,
        });
      } catch {
        // Handle logging error silently
      }
    }
  };
}

export function auditLogWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  auditLogService: AuditLogService,
  auditType: AuditType,
  params: {
    entityType?: EntityName;
    businessId?: string | null;
    entityId?: string | string[] | null;
    userId: string;
    ip: string | null;
  },
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const isBusinessAction = Object.values(AuditActionType).includes(
    auditType as AuditActionType,
  );

  if (isBusinessAction) {
    const action = auditType as AuditActionType;

    if (action === AuditActionType.CREATE) {
      if (!params.entityType) {
        throw new Error("CREATE requires entityType");
      }

      return auditActionWrapper(
        fn,
        auditLogService,
        action,
        params.entityType,
        params.businessId ?? null,
        params.userId,
        params.entityId ?? null,
        params.ip,
      );
    }

    if (!params.entityType || !params.businessId || !params.entityId) {
      throw new Error(
        "UPDATE/DELETE action requires entityType, businessId, and entityId(s)",
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

  return auditSecurityWrapper(
    fn,
    auditLogService,
    auditType as AuditSecurityType,
    params.userId,
    params.ip,
  );
}
