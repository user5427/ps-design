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
import type { AuditBusinessLogQuery, AuditSecurityLogQuery } from "@ps-design/schemas/audit";

type EntityMap = {
  User: typeof User;
  Business: typeof Business;
  Product: typeof Product;
  ProductUnit: typeof ProductUnit;
  StockChange: typeof StockChange;
  StockLevel: typeof StockLevel;
  Country: typeof Country;
  Tax: typeof Tax;
  MenuItem: typeof MenuItem;
  MenuItemCategory: typeof MenuItemCategory;
  MenuItemVariation: typeof MenuItemVariation;
  MenuItemBaseProduct: typeof MenuItemBaseProduct;
  MenuItemVariationProduct: typeof MenuItemVariationProduct;
  AuditBusinessLog: typeof AuditBusinessLog;
  AuditSecurityLog: typeof AuditSecurityLog;
};

const entityClassMap: EntityMap = {
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
};

export class AuditLogRepository {
  constructor(private dataSource: DataSource) { }

  getRepository<T extends keyof EntityMap>(
    entityName: T
  ): Repository<InstanceType<EntityMap[ T ]>> {
    const entityClass = entityClassMap[ entityName ];
    return this.dataSource.getRepository(entityClass) as Repository<
      InstanceType<EntityMap[ T ]>
    >;
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

  async findPaginatedBusinessLogs(query: AuditBusinessLogQuery) {
    const { page, limit, userId, action, from, to } = query;

    const repo = this.getRepository("AuditBusinessLog");

    const qb = repo.createQueryBuilder("log");

    // Filters
    if (userId) qb.andWhere("log.userId = :userId", { userId });
    if (action) qb.andWhere("log.action = :action", { action });
    if (from) qb.andWhere("log.createdAt >= :from", { from: new Date(from) });
    if (to) qb.andWhere("log.createdAt <= :to", { to: new Date(to) });

    // Sorting, pagination
    qb.orderBy("log.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    // Execute query
    const [ items, total ] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPaginatedSecurityLogs(query: AuditSecurityLogQuery) {
    const { page, limit, userId, action, from, to } = query;

    const repo = this.getRepository("AuditSecurityLog");

    const qb = repo.createQueryBuilder("log");

    // Filters
    if (userId) qb.andWhere("log.userId = :userId", { userId });
    if (action) qb.andWhere("log.action = :action", { action });
    if (from) qb.andWhere("log.createdAt >= :from", { from: new Date(from) });
    if (to) qb.andWhere("log.createdAt <= :to", { to: new Date(to) });

    // Sorting and pagination
    qb.orderBy("log.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    // Execute query
    const [ items, total ] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async getBusinessLogById(id: string) {
    const repo = this.getRepository("AuditBusinessLog");
    return repo.findOneOrFail({ where: { id } });
  }

  async getSecurityLogById(id: string) {
    const repo = this.getRepository("AuditSecurityLog");
    return repo.findOneOrFail({ where: { id } });
  }
}
