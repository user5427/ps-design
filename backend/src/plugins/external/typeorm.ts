import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DataSource } from "typeorm";
import { createDataSource } from "@/database/data-source";
import { Business, BusinessRepository } from "@/modules/business";
import { Category, CategoryRepository } from "@/modules/category";
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
import { MenuItem, MenuItemRepository } from "@/modules/menu/menu-item";
import { MenuItemVariation } from "@/modules/menu/menu-item-variation";
import { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product";
import { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product";
import {
  ServiceDefinition,
  ServiceDefinitionRepository,
} from "@/modules/appointments/service-definition";
import {
  StaffService,
  StaffServiceRepository,
} from "@/modules/appointments/staff-service";
import {
  Availability,
  AvailabilityRepository,
} from "@/modules/appointments/availability";
import {
  Appointment,
  AppointmentRepository,
} from "@/modules/appointments/appointment";
import {
  AppointmentPayment,
  PaymentLineItem,
  AppointmentPaymentRepository,
} from "@/modules/appointments/appointment-payment";
import { GiftCard, GiftCardRepository } from "@/modules/gift-card";
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
  category: CategoryRepository;
  menuItem: MenuItemRepository;
  serviceDefinition: ServiceDefinitionRepository;
  staffService: StaffServiceRepository;
  availability: AvailabilityRepository;
  appointment: AppointmentRepository;
  appointmentPayment: AppointmentPaymentRepository;
  giftCard: GiftCardRepository;
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

  const availabilityRepo = new AvailabilityRepository(
    dataSource,
    dataSource.getRepository(Availability),
    dataSource.getRepository(User),
  );

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
    category: new CategoryRepository(
      dataSource.getRepository(Category),
      dataSource.getRepository(MenuItem),
      dataSource.getRepository(ServiceDefinition),
    ),
    menuItem: new MenuItemRepository(
      dataSource,
      dataSource.getRepository(MenuItem),
      dataSource.getRepository(Category),
      dataSource.getRepository(MenuItemVariation),
      dataSource.getRepository(MenuItemBaseProduct),
      dataSource.getRepository(MenuItemVariationProduct),
      dataSource.getRepository(Product),
      dataSource.getRepository(StockLevel),
    ),
    serviceDefinition: new ServiceDefinitionRepository(
      dataSource.getRepository(ServiceDefinition),
      dataSource.getRepository(Category),
      dataSource.getRepository(StaffService),
    ),
    staffService: new StaffServiceRepository(
      dataSource.getRepository(StaffService),
      dataSource.getRepository(User),
      dataSource.getRepository(ServiceDefinition),
    ),
    availability: availabilityRepo,
    appointment: new AppointmentRepository(
      dataSource,
      dataSource.getRepository(Appointment),
      dataSource.getRepository(StaffService),
      availabilityRepo,
    ),
    appointmentPayment: new AppointmentPaymentRepository(
      dataSource,
      dataSource.getRepository(AppointmentPayment),
      dataSource.getRepository(PaymentLineItem),
      dataSource.getRepository(Appointment),
    ),
    giftCard: new GiftCardRepository(dataSource.getRepository(GiftCard)),
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
