import { IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import { calculatePaginationMetadata, executePaginatedQuery } from "@/shared/pagination-utils";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory";
import type { Product } from "@/modules/inventory/product/product.entity";
import type { ProductUnit } from "./product-unit.entity";
import type {
  ICreateProductUnit,
  IUpdateProductUnit,
} from "./product-unit.types";
import { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class ProductUnitRepository {
  constructor(
    private repository: Repository<ProductUnit>,
    private productRepository: Repository<Product>,
  ) {}



  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<ProductUnit>> {
    const qb = this.repository.createQueryBuilder("unit");

    qb.where("unit.businessId = :businessId", { businessId });
    qb.andWhere("unit.deletedAt IS NULL");

    // Handle simple search if provided
    if (query.search) {
      qb.andWhere(
        "(unit.name ILIKE :search OR unit.symbol ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    return executePaginatedQuery(qb, query, PRODUCT_UNIT_MAPPING.fields, "unit");
  }

  async findById(id: string): Promise<ProductUnit | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<ProductUnit | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async findByNameAndBusinessId(
    name: string,
    businessId: string,
  ): Promise<ProductUnit | null> {
    return this.repository.findOne({
      where: { name, businessId, deletedAt: IsNull() },
    });
  }

  async create(data: ICreateProductUnit): Promise<ProductUnit> {
    try {
      const unit = this.repository.create(data);
      return await this.repository.save(unit);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Product unit with this name already exists");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateProductUnit,
  ): Promise<ProductUnit> {
    const unit = await this.findByIdAndBusinessId(id, businessId);
    if (!unit) {
      throw new NotFoundError("Product unit not found");
    }

    try {
      await this.repository.update(id, data);
      const updatedUnit = await this.findById(id);
      if (!updatedUnit) {
        throw new NotFoundError("Product unit not found after update");
      }
      return updatedUnit;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Product unit with this name already exists");
      }
      throw error;
    }
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    for (const id of ids) {
      const unit = await this.findByIdAndBusinessId(id, businessId);
      if (!unit) {
        throw new NotFoundError(`Product unit ${id} not found`);
      }

      const productsCount = await this.productRepository.count({
        where: { productUnitId: id, deletedAt: IsNull() },
      });

      if (productsCount > 0) {
        throw new ConflictError(
          `Cannot delete product unit "${unit.name}" that is in use by products`,
        );
      }
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
