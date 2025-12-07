import type { Repository } from "typeorm";
import { StockLevel } from "./stock-level.entity";
import type { ICreateStockLevel } from "./stock-level.types";

export class StockLevelRepository {
  constructor(private repository: Repository<StockLevel>) {}

  async findByProductId(productId: string): Promise<StockLevel | null> {
    return this.repository.findOne({
      where: { productId },
    });
  }

  async findAllByBusinessId(businessId: string): Promise<StockLevel[]> {
    return this.repository.find({
      where: { businessId },
    });
  }

  async upsertSafe(data: ICreateStockLevel): Promise<StockLevel> {
    const updateResult = await this.repository
      .createQueryBuilder()
      .update(StockLevel)
      .set({ quantity: () => `quantity + ${data.quantity}` })
      .where("productId = :productId", { productId: data.productId })
      .andWhere("businessId = :businessId", { businessId: data.businessId })
      .execute();

    if (updateResult.affected && updateResult.affected > 0) {
      return this.findByProductId(data.productId) as Promise<StockLevel>;
    }

    const level = this.repository.create(data);
    return this.repository.save(level);
  }
}
