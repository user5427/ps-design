import type { AuditLogRepository } from "./audit-log.repository";
import type {
  ICreateAuditSecurityLog,
  ICreateAuditBusinessLog,
} from "./audit-log.types";
import type { AuditBusinessLog } from "./audit-business-log.entity";
import type { AuditSecurityLog } from "./audit-security-log.entity";

export class AuditLogService {
  constructor(private auditLogs: AuditLogRepository) {}

  async logBusiness(data: ICreateAuditBusinessLog): Promise<AuditBusinessLog> {
    return this.auditLogs.create(data);
  }

  async logSecurity(data: ICreateAuditSecurityLog): Promise<AuditSecurityLog> {
    return this.auditLogs.create(data);
  }

  async getEntitySnapshot(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any> | null> {
    return this.auditLogs.getEntitySnapshot(entityType, entityId);
  }
}
