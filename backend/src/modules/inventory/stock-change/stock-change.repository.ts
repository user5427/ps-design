import {
  type DataSource,
  type FindOptionsWhere,
  IsNull,
  type Repository,
} from "typeorm";
import { BadRequestError, NotFoundError } from "@/shared/errors";
import { executePaginatedQuery } from "@/shared/pagination-utils";
import { STOCK_CHANGE_MAPPING } from "@ps-design/constants/inventory";
import type { Product } from "@/modules/inventory/product/product.entity";
import { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import { StockChange } from "./stock-change.entity";
import type { ICreateStockChange, StockChangeType } from "./stock-change.types";
import { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class StockChangeRepository {
  constructor(
    private repository: Repository<StockChange>,
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}



  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<StockChange>> {
    const qb = this.repository.createQueryBuilder("change");

    qb.leftJoinAndSelect("change.product", "product");
    qb.leftJoinAndSelect("product.productUnit", "productUnit");

    qb.where("change.businessId = :businessId", { businessId });
    qb.andWhere("change.deletedAt IS NULL");

    // Handle simple search if provided
    if (query.search) {
      qb.andWhere("product.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return executePaginatedQuery(qb, query, STOCK_CHANGE_MAPPING.fields, "change");
  }

  async findById(id: string): Promise<StockChange | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["product", "product.productUnit"],
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<StockChange | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async create(data: ICreateStockChange): Promise<StockChange> {
    const product = await this.productRepository.findOne({
      where: {
        id: data.productId,
        businessId: data.businessId,
        deletedAt: IsNull(),
      },
    });

    if (!product) {
      throw new BadRequestError("Invalid product");
    }

    return this.dataSource.transaction(async (manager) => {
      const stockChangeRepo = manager.getRepository(StockChange);
      const stockLevelRepo = manager.getRepository(StockLevel);

      const change = stockChangeRepo.create({
        productId: data.productId,
        businessId: data.businessId,
        quantity: data.quantity,
        type: data.type as StockChangeType,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate)
          : null,
        createdByUserId: data.createdByUserId,
      });
      const savedChange = await stockChangeRepo.save(change);

      const existingLevel = await stockLevelRepo.findOne({
        where: { productId: data.productId },
      });
      if (existingLevel) {
        const newQuantity = existingLevel.quantity + data.quantity;
        await stockLevelRepo.update(existingLevel.id, {
          quantity: newQuantity,
        });
      } else {
        const newLevel = stockLevelRepo.create({
          productId: data.productId,
          businessId: data.businessId,
          quantity: data.quantity,
        });
        await stockLevelRepo.save(newLevel);
      }

      const foundChange = await stockChangeRepo.findOne({
        where: { id: savedChange.id },
        relations: ["product", "product.productUnit"],
      });
      if (!foundChange) {
        throw new NotFoundError("Stock change not found after saving");
      }
      return foundChange;
    });
  }

  async update(
    id: string,
    businessId: string,
    data: {
      quantity?: number;
      type?: StockChangeType;
      expirationDate?: string | null;
    },
  ): Promise<StockChange> {
    const existingChange = await this.findByIdAndBusinessId(id, businessId);
    if (!existingChange) {
      throw new NotFoundError("Stock change not found");
    }

    return this.dataSource.transaction(async (manager) => {
      const stockChangeRepo = manager.getRepository(StockChange);
      const stockLevelRepo = manager.getRepository(StockLevel);

      const oldQuantity = existingChange.quantity;
      const newQuantity = data.quantity ?? oldQuantity;
      const quantityDiff = newQuantity - oldQuantity;

      const updateData: Partial<StockChange> = {};
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.expirationDate !== undefined) {
        updateData.expirationDate = data.expirationDate
          ? new Date(data.expirationDate)
          : null;
      }

      await stockChangeRepo.update(id, updateData);

      if (quantityDiff !== 0) {
        const stockLevel = await stockLevelRepo.findOne({
          where: { productId: existingChange.productId },
        });
        if (stockLevel) {
          await stockLevelRepo.update(stockLevel.id, {
            quantity: stockLevel.quantity + quantityDiff,
          });
        }
      }

      const updatedChange = await stockChangeRepo.findOne({
        where: { id },
        relations: ["product", "product.productUnit"],
      });
      if (!updatedChange) {
        throw new NotFoundError("Stock change not found after update");
      }
      return updatedChange;
    });
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    const changes = await this.repository.find({
      where: ids.map((id) => ({ id, businessId, deletedAt: IsNull() })),
    });

    if (changes.length === 0) return;

    await this.dataSource.transaction(async (manager) => {
      const stockChangeRepo = manager.getRepository(StockChange);
      const stockLevelRepo = manager.getRepository(StockLevel);

      const quantityByProduct: Record<string, number> = {};
      for (const change of changes) {
        quantityByProduct[change.productId] =
          (quantityByProduct[change.productId] || 0) + change.quantity;
      }

      await stockChangeRepo.update(
        changes.map((c) => c.id),
        { deletedAt: new Date() },
      );

      for (const [productId, totalQuantity] of Object.entries(
        quantityByProduct,
      )) {
        const stockLevel = await stockLevelRepo.findOne({
          where: { productId },
        });
        if (stockLevel) {
          await stockLevelRepo.update(stockLevel.id, {
            quantity: stockLevel.quantity - totalQuantity,
          });
        }
      }
    });
  }
}
