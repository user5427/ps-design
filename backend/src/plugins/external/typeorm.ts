import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DataSource } from "typeorm";
import { createDataSource } from '@/database/data-source';
import { Business, BusinessRepository } from '@/modules/business';
import { Product, ProductRepository } from '@/modules/inventory/product';
import {
  ProductUnit,
  ProductUnitRepository,
} from '@/modules/inventory/product-unit';
import {
  StockChange,
  StockChangeRepository,
} from '@/modules/inventory/stock-change';
import {
  StockLevel,
  StockLevelRepository,
} from '@/modules/inventory/stock-level';
import { RefreshToken, RefreshTokenRepository } from '@/modules/refresh-token';
import { User, UserRepository } from '@/modules/user';

export interface Services {
  dataSource: DataSource;
  business: BusinessRepository;
  user: UserRepository;
  refreshToken: RefreshTokenRepository;
  productUnit: ProductUnitRepository;
  product: ProductRepository;
  stockLevel: StockLevelRepository;
  stockChange: StockChangeRepository;
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
  };

  fastify.decorate("db", services);

  fastify.addHook("onClose", async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      fastify.log.info("TypeORM DataSource destroyed");
    }
  });
});
