import type { Repository } from "typeorm";
import { executePaginatedQuery } from "@/shared/pagination-utils";
import { STOCK_LEVEL_MAPPING } from "@ps-design/constants/inventory/stock-level";
import { StockLevel } from "./stock-level.entity";
import type { ICreateStockLevel } from "./stock-level.types";
import type { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

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

  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<StockLevel>> {
    const qb = this.repository.createQueryBuilder("level");

    qb.where("level.businessId = :businessId", { businessId });

    return executePaginatedQuery(qb, query, STOCK_LEVEL_MAPPING.fields, "level");
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
