import { IsNull, type Repository } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import { calculatePaginationMetadata, executePaginatedQuery } from "@/shared/pagination-utils";
import { PRODUCT_FIELD_MAPPING } from "@/constants/inventory";
import type { ProductUnit } from "@/modules/inventory/product-unit/product-unit.entity";
import type { Product } from "./product.entity";
import type { ICreateProduct, IUpdateProduct } from "./product.types";
import { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class ProductRepository {
  constructor(
    private repository: Repository<Product>,
    private productUnitRepository: Repository<ProductUnit>,
  ) {}



  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<Product>> {
    const qb = this.repository.createQueryBuilder("product");

    qb.leftJoinAndSelect("product.productUnit", "productUnit");
    qb.leftJoinAndSelect("product.stockLevel", "stockLevel");

    qb.where("product.businessId = :businessId", { businessId });
    qb.andWhere("product.deletedAt IS NULL");

    // Handle simple search if provided
    if (query.search) {
      qb.andWhere("product.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return executePaginatedQuery(qb, query, PRODUCT_FIELD_MAPPING, "product");
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["productUnit", "stockLevel"],
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: ["productUnit", "stockLevel"],
    });
  }

  async findByIdSimple(
    id: string,
    businessId: string,
  ): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async getById(id: string, businessId: string): Promise<Product> {
    const product = await this.findByIdAndBusinessId(id, businessId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  async countByProductUnitId(productUnitId: string): Promise<number> {
    return this.repository.count({
      where: { productUnitId, deletedAt: IsNull() },
    });
  }

  async create(data: ICreateProduct): Promise<Product> {
    const unit = await this.productUnitRepository.findOne({
      where: {
        id: data.productUnitId,
        businessId: data.businessId,
        deletedAt: IsNull(),
      },
    });

    if (!unit) {
      throw new BadRequestError("Invalid product unit");
    }

    try {
      const product = this.repository.create(data);
      const saved = await this.repository.save(product);
      return (await this.findById(saved.id))!;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Product with this name already exists");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateProduct,
  ): Promise<Product> {
    const product = await this.findByIdSimple(id, businessId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (data.productUnitId) {
      const unit = await this.productUnitRepository.findOne({
        where: { id: data.productUnitId, businessId, deletedAt: IsNull() },
      });

      if (!unit) {
        throw new BadRequestError("Invalid product unit");
      }
    }

    try {
      const updatedProduct = await this.findById(id);
      if (!updatedProduct) {
        throw new NotFoundError("Product not found after update");
      }
      return updatedProduct;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Product with this name already exists");
      }
      throw error;
    }
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    for (const id of ids) {
      const product = await this.findByIdSimple(id, businessId);
      if (!product) {
        throw new NotFoundError(`Product ${id} not found`);
      }
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
