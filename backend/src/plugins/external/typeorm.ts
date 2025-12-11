import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DataSource } from "typeorm";
import { createDataSource } from "@/database/data-source";
import { Business, BusinessRepository } from "@/modules/business";
import { Product, ProductRepository } from "@/modules/inventory/product";
import {
  ProductUnit,
  ProductUnitRepository,
} from "@/modules/inventory/product-unit";
import {
  StockChange,
  StockChangeRepository,
} from "@/modules/inventory/stock-change";
import {
  StockLevel,
  StockLevelRepository,
} from "@/modules/inventory/stock-level";
import { RefreshToken, RefreshTokenRepository } from "@/modules/refresh-token";
import {
  User,
  UserRepository,
  Role,
  RoleRepository,
  ScopeEntity,
  ScopeRepository,
  UserRole,
  UserRoleRepository,
  RoleScope,
  RoleScopeRepository,
} from "@/modules/user";
import {
  MenuItemCategory,
  MenuItemCategoryRepository,
} from "@/modules/menu/menu-item-category";
import { MenuItem, MenuItemRepository } from "@/modules/menu/menu-item";
import { MenuItemVariation } from "@/modules/menu/menu-item-variation";
import { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product";
import { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product";
import {
  AuditLogService,
  AuditLogRepository,
} from "@/modules/audit";

export interface Services {
  dataSource: DataSource;
  business: BusinessRepository;
  user: UserRepository;
  role: RoleRepository;
  scope: ScopeRepository;
  userRole: UserRoleRepository;
  roleScope: RoleScopeRepository;
  refreshToken: RefreshTokenRepository;
  productUnit: ProductUnitRepository;
  product: ProductRepository;
  stockLevel: StockLevelRepository;
  stockChange: StockChangeRepository;
  menuItemCategory: MenuItemCategoryRepository;
  menuItem: MenuItemRepository;
  auditLogRepository: AuditLogRepository;
  auditLogService: AuditLogService;
}

declare module "fastify" {
  interface FastifyInstance {
    db: Services;
  }
}

export default fp(async function typeormPlugin(fastify: FastifyInstance) {
  const isProd = fastify.config.NODE_ENV === "production";

  const dataSource = createDataSource({
    url: fastify.config.DATABASE_URL,
    synchronize: !isProd,
    logging: !isProd,
  });

  await dataSource.initialize();
  fastify.log.info("TypeORM DataSource initialized");

  const services: Services = {
    dataSource,
    business: new BusinessRepository(dataSource.getRepository(Business)),
    user: new UserRepository(dataSource.getRepository(User)),
    role: new RoleRepository(dataSource.getRepository(Role)),
    scope: new ScopeRepository(dataSource.getRepository(ScopeEntity)),
    userRole: new UserRoleRepository(dataSource.getRepository(UserRole)),
    roleScope: new RoleScopeRepository(dataSource.getRepository(RoleScope)),
    refreshToken: new RefreshTokenRepository(
      dataSource.getRepository(RefreshToken),
    ),
    productUnit: new ProductUnitRepository(
      dataSource.getRepository(ProductUnit),
      dataSource.getRepository(Product),
    ),
    product: new ProductRepository(
      dataSource.getRepository(Product),
      dataSource.getRepository(ProductUnit),
    ),
    stockLevel: new StockLevelRepository(dataSource.getRepository(StockLevel)),
    stockChange: new StockChangeRepository(
      dataSource.getRepository(StockChange),
      dataSource.getRepository(Product),
      dataSource,
    ),
    menuItemCategory: new MenuItemCategoryRepository(
      dataSource.getRepository(MenuItemCategory),
      dataSource.getRepository(MenuItem),
    ),
    menuItem: new MenuItemRepository(
      dataSource,
      dataSource.getRepository(MenuItem),
      dataSource.getRepository(MenuItemCategory),
      dataSource.getRepository(MenuItemVariation),
      dataSource.getRepository(MenuItemBaseProduct),
      dataSource.getRepository(MenuItemVariationProduct),
      dataSource.getRepository(Product),
      dataSource.getRepository(StockLevel),
    ),
    auditLogRepository: new AuditLogRepository(dataSource),
    auditLogService: new AuditLogService(dataSource),
  };

  fastify.decorate("db", services);

  fastify.addHook("onClose", async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      fastify.log.info("TypeORM DataSource destroyed");
    }
  });
});
