import type { Repository } from "typeorm";
import type { AuditBusinessLog } from "./audit-business-log.entity";
import type { AuditSecurityLog } from "./audit-security-log.entity";
import type {
  ICreateAuditBusinessLog,
  ICreateAuditSecurityLog,
} from "./audit-log.types";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";

export class AuditLogRepository {
  constructor(
    private businessLogRepo: Repository<AuditBusinessLog>,
    private securityLogRepo: Repository<AuditSecurityLog>,
    private userRepo: Repository<User>,
    private businessRepo: Repository<Business>,
  ) { }

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
    if ("entityId" in data) {
      const entry = this.businessLogRepo.create({
        businessId: data.businessId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValues: data.oldValues ?? null,
        newValues: data.newValues ?? null,
        userId: data.userId ?? null,
        ip: data.ip ?? null,
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

  async getEntitySnapshot(entityType: string, entityId: string) {
    switch (entityType) {
      case "Business":
        const business = await this.businessRepo.findOne({
          where: { id: entityId },
          relations: [], // add any relations you want to include in snapshot
        });
        return business ? { ...business } : null;

      case "User":
        const user = await this.userRepo.findOne({
          where: { id: entityId },
        });
        return user ? { ...user } : null;

      default:
        return null;
    }
  }

}
