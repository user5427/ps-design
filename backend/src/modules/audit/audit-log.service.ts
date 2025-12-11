import { DataSource, Repository } from "typeorm";
import { AuditBusinessLog } from "./audit-business-log.entity";
import { AuditSecurityLog } from "./audit-security-log.entity";
import { User } from "@/modules/user/user.entity";
import { Business } from "@/modules/business/business.entity";
import { Product } from "@/modules/inventory/product/product.entity";
import { ProductUnit } from "@/modules/inventory/product-unit/product-unit.entity";
import { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import { Country } from "@/modules/country/country.entity";
import { Tax } from "@/modules/tax/tax.entity";
import { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";

import { ICreateAuditBusinessLog, ICreateAuditSecurityLog } from "./audit-log.types";

// Map of all supported entities
const EntityMap = {
  User,
  Business,
  Product,
  ProductUnit,
  StockChange,
  StockLevel,
  Country,
  Tax,
  MenuItem,
  MenuItemCategory,
  MenuItemVariation,
  MenuItemBaseProduct,
  MenuItemVariationProduct,
  AuditBusinessLog,
  AuditSecurityLog,
} as const;

type EntityName = keyof typeof EntityMap;

export class AuditLogService {
  constructor(private dataSource: DataSource) { }

  // Dynamically get repository for any entity
  getRepository<T extends EntityName>(
    entityName: T
  ): Repository<InstanceType<typeof EntityMap[ T ]>> {
    const entityClass = EntityMap[ entityName ];
    return this.dataSource.getRepository(
      entityClass
    ) as Repository<InstanceType<typeof EntityMap[ T ]>>;
  }

  // Generic snapshot for any entity
  async getEntitySnapshot(entityType: EntityName, entityId: string) {
    const repo = this.getRepository(entityType);
    const entity = await repo.findOne({ where: { id: entityId } });
    return entity ? { ...entity } : null;
  }

  // Audit business action
  async logBusiness(log: ICreateAuditBusinessLog) {
    const repo = this.getRepository("AuditBusinessLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }

  // Audit security action
  async logSecurity(log: ICreateAuditSecurityLog) {
    const repo = this.getRepository("AuditSecurityLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }
}
