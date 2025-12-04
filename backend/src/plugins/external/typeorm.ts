import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DataSource } from "typeorm";
import { createDataSource } from "../../database/data-source";
import { Business, BusinessService } from "../../modules/business";
import { Product, ProductService } from "../../modules/inventory/product";
import {
  ProductUnit,
  ProductUnitService,
} from "../../modules/inventory/product-unit";
import {
  StockChange,
  StockChangeService,
} from "../../modules/inventory/stock-change";
import {
  StockLevel,
  StockLevelService,
} from "../../modules/inventory/stock-level";
import { RefreshToken, RefreshTokenService } from "../../modules/refresh-token";
import { User, UserService } from "../../modules/user";

export interface Services {
  dataSource: DataSource;
  business: BusinessService;
  user: UserService;
  refreshToken: RefreshTokenService;
  productUnit: ProductUnitService;
  product: ProductService;
  stockLevel: StockLevelService;
  stockChange: StockChangeService;
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
    logging: !isProd,
  });

  await dataSource.initialize();
  fastify.log.info("TypeORM DataSource initialized");

  const services: Services = {
    dataSource,
    business: new BusinessService(dataSource.getRepository(Business)),
    user: new UserService(dataSource.getRepository(User)),
    refreshToken: new RefreshTokenService(
      dataSource.getRepository(RefreshToken),
    ),
    productUnit: new ProductUnitService(
      dataSource.getRepository(ProductUnit),
      dataSource.getRepository(Product),
    ),
    product: new ProductService(
      dataSource.getRepository(Product),
      dataSource.getRepository(ProductUnit),
    ),
    stockLevel: new StockLevelService(dataSource.getRepository(StockLevel)),
    stockChange: new StockChangeService(
      dataSource.getRepository(StockChange),
      dataSource.getRepository(Product),
      dataSource,
    ),
  };

  fastify.decorate("db", services);

  fastify.addHook("onClose", async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      fastify.log.info("TypeORM DataSource destroyed");
    }
  });
});
