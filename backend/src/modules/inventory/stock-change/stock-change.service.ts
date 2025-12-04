import { type DataSource, IsNull, type Repository } from "typeorm";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import type { Product } from "../product/product.entity";
import { StockLevel } from "../stock-level/stock-level.entity";
import { StockChange } from "./stock-change.entity";
import type { ICreateStockChange, StockChangeType } from "./stock-change.types";

export class StockChangeService {
  constructor(
    private repository: Repository<StockChange>,
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async findAllByBusinessId(
    businessId: string,
    productId?: string,
  ): Promise<StockChange[]> {
    const where: any = { businessId, deletedAt: IsNull() };
    if (productId) {
      where.productId = productId;
    }
    return this.repository.find({
      where,
      relations: ["product", "product.productUnit", "createdBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<StockChange | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["product", "product.productUnit", "createdBy"],
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

      return (await stockChangeRepo.findOne({
        where: { id: savedChange.id },
        relations: ["product", "product.productUnit", "createdBy"],
      }))!;
    });
  }

  async delete(id: string, businessId: string): Promise<void> {
    const change = await this.findByIdAndBusinessId(id, businessId);
    if (!change) {
      throw new NotFoundError("Stock change not found");
    }

    await this.dataSource.transaction(async (manager) => {
      const stockChangeRepo = manager.getRepository(StockChange);
      const stockLevelRepo = manager.getRepository(StockLevel);

      await stockChangeRepo.update(id, { deletedAt: new Date() });

      const stockLevel = await stockLevelRepo.findOne({
        where: { productId: change.productId },
      });
      if (stockLevel) {
        const newQuantity = stockLevel.quantity - change.quantity;
        await stockLevelRepo.update(stockLevel.id, { quantity: newQuantity });
      }
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }
}
