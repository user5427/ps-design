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


type EntityMap = {
  "User": typeof User;
  "Business": typeof Business;
  "Product": typeof Product;
  "ProductUnit": typeof ProductUnit;
  "StockChange": typeof StockChange;
  "StockLevel": typeof StockLevel;
  "Country": typeof Country;
  "Tax": typeof Tax;
  "MenuItem": typeof MenuItem;
  "MenuItemCategory": typeof MenuItemCategory;
  "MenuItemVariation": typeof MenuItemVariation;
  "MenuItemBaseProduct": typeof MenuItemBaseProduct;
  "MenuItemVariationProduct": typeof MenuItemVariationProduct;
  "AuditBusinessLog": typeof AuditBusinessLog;
  "AuditSecurityLog": typeof AuditSecurityLog;
};

const entityClassMap: EntityMap = {
  "User": User,
  "Business": Business,
  "Product": Product,
  "ProductUnit": ProductUnit,
  "StockChange": StockChange,
  "StockLevel": StockLevel,
  "Country": Country,
  "Tax": Tax,
  "MenuItem": MenuItem,
  "MenuItemCategory": MenuItemCategory,
  "MenuItemVariation": MenuItemVariation,
  "MenuItemBaseProduct": MenuItemBaseProduct,
  "MenuItemVariationProduct": MenuItemVariationProduct,
  "AuditBusinessLog": AuditBusinessLog,
  "AuditSecurityLog": AuditSecurityLog,
};

export class AuditLogRepository {
  private dataSource: DataSource;
  constructor(dataSource: DataSource) { this.dataSource = dataSource; }

  getRepository<T extends keyof EntityMap>(entityName: T): Repository<InstanceType<EntityMap[ T ]>> {
    const entityClass = entityClassMap[ entityName ];
    return this.dataSource.getRepository(entityClass) as Repository<InstanceType<EntityMap[ T ]>>;
  }

  async getEntitySnapshot(entityType: keyof EntityMap, entityId: string) {
    const repo = this.getRepository(entityType);
    const entity = await repo.findOne({ where: { id: entityId } });
    return entity ? { ...entity } : null;
  }

  async logBusiness(log: Partial<AuditBusinessLog>) {
    const repo = this.getRepository("AuditBusinessLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }

  async logSecurity(log: Partial<AuditSecurityLog>) {
    const repo = this.getRepository("AuditSecurityLog");
    const audit = repo.create(log);
    await repo.save(audit);
  }
}
