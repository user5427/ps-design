import type { Repository } from "typeorm";
import type { AuditBusinessLog } from "./audit-business-log.entity";
import type { AuditSecurityLog } from "./audit-security-log.entity";
import type {
  ICreateAuditBusinessLog,
  ICreateAuditSecurityLog,
} from "./audit-log.types";

export class AuditLogRepository {
  constructor(
    private businessLogRepo: Repository<AuditBusinessLog>,
    private securityLogRepo: Repository<AuditSecurityLog>,
  ) {}

  async findBusinessById(id: string): Promise<AuditBusinessLog | null> {
    return this.businessLogRepo.findOne({ where: { id } });
  }

  async findByBusiness(businessId: string): Promise<AuditBusinessLog[]> {
    return this.businessLogRepo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditBusinessLog[]> {
    return this.businessLogRepo.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }

  async create(data: ICreateAuditBusinessLog): Promise<AuditBusinessLog>;
  async create(data: ICreateAuditSecurityLog): Promise<AuditSecurityLog>;

  async create(
    data: ICreateAuditBusinessLog | ICreateAuditSecurityLog,
  ): Promise<AuditBusinessLog | AuditSecurityLog> {
    if ("businessId" in data) {
      const entry = this.businessLogRepo.create({
        businessId: data.businessId,
        userId: data.userId ?? null,
        ip: data.ip ?? null,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValues: data.oldValues ?? null,
        newValues: data.newValues ?? null,
        result: data.result,
      });
      return this.businessLogRepo.save(entry);
    } else {
      const entry = this.securityLogRepo.create({
        action: data.action,
        userId: data.userId ?? null,
        ip: data.ip ?? null,
        result: data.result,
      });
      return this.securityLogRepo.save(entry);
    }
  }

  async getEntitySnapshot(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any> | null> {
    const latestLog = await this.businessLogRepo.findOne({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });

    return latestLog ? latestLog.newValues : null;
  }
}
