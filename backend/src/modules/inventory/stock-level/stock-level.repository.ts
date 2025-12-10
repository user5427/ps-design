import type { Repository } from "typeorm";
import { calculatePaginationMetadata, executePaginatedQuery, type FieldMapping } from "@/shared/pagination-utils";
import { StockLevel } from "./stock-level.entity";
import type { ICreateStockLevel } from "./stock-level.types";
import { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class StockLevelRepository {
  constructor(private repository: Repository<StockLevel>) {}

  private readonly fieldMapping: FieldMapping = {
    quantity: { column: "level.quantity", type: "number" },
    updatedAt: { column: "level.updatedAt", type: "date" },
  };

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

  async findAllPaginatedAdvanced(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<StockLevel>> {
    const qb = this.repository.createQueryBuilder("level");

    qb.where("level.businessId = :businessId", { businessId });

    return executePaginatedQuery(qb, query, this.fieldMapping, "level");
  }

  async findAllPaginatedByBusinessId(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<StockLevel>> {
    const query = this.repository.createQueryBuilder("level");

    query.where("level.businessId = :businessId", { businessId });
    query.orderBy("level.updatedAt", "DESC");

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      metadata: calculatePaginationMetadata(total, page, limit),
    };
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
