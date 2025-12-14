import type { DataSource, Repository } from "typeorm";
import { AuditBusinessLog } from "./audit-business-log.entity";
import { AuditSecurityLog } from "./audit-security-log.entity";
import { User } from "@/modules/user/user.entity";
import { Business } from "@/modules/business/business.entity";
import { Product } from "@/modules/inventory/product/product.entity";
import { ProductUnit } from "@/modules/inventory/product-unit/product-unit.entity";
import { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import { Category } from "@/modules/category/category.entity";
import { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";
import { Availability } from "@/modules/appointments/availability/availability.entity";
import { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import { AppointmentPayment } from "@/modules/appointments/appointment-payment/appointment-payment.entity";
import { GiftCard } from "@/modules/gift-card/gift-card.entity";
import { Tax } from "@/modules/tax/tax.entity";
import type {
  ICreateAuditBusinessLog,
  ICreateAuditSecurityLog,
} from "./audit-log.types";

// Map of all supported entities
const EntityMap = {
  User,
  Business,
  Product,
  ProductUnit,
  StockChange,
  StockLevel,
  Category,
  MenuItem,
  MenuItemVariation,
  MenuItemBaseProduct,
  MenuItemVariationProduct,
  ServiceDefinition,
  StaffService,
  Availability,
  Appointment,
  AppointmentPayment,
  GiftCard,
  Tax,
  AuditBusinessLog,
  AuditSecurityLog,
} as const;

type EntityName = keyof typeof EntityMap;

export class AuditLogService {
  constructor(private dataSource: DataSource) {}

  getRepository<T extends EntityName>(
    entityName: T,
  ): Repository<InstanceType<(typeof EntityMap)[T]>> {
    const entityClass = EntityMap[entityName];
    return this.dataSource.getRepository(entityClass) as Repository<
      InstanceType<(typeof EntityMap)[T]>
    >;
  }

  async getEntitySnapshot(entityType: EntityName, entityId: string) {
    const repo = this.getRepository(entityType);
    const entity = await repo.findOne({ where: { id: entityId } });
    return entity ? { ...entity } : null;
  }

  async logBusiness(log: ICreateAuditBusinessLog) {
    const repo = this.getRepository("AuditBusinessLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }

  async logBusinessBulk(logs: ICreateAuditBusinessLog[]) {
    const repo = this.getRepository("AuditBusinessLog");
    const audits = repo.create(logs);
    await repo.save(audits);
  }

  async logSecurity(log: ICreateAuditSecurityLog) {
    const repo = this.getRepository("AuditSecurityLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }
}
