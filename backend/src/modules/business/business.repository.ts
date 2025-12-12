import { IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import { executePaginatedQuery } from "@/shared/pagination-utils";
import { BUSINESS_MAPPING } from "@ps-design/constants/business";
import type { Business } from "./business.entity";
import type { ICreateBusiness, IUpdateBusiness } from "./business.types";
import type { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class BusinessRepository {
  constructor(private repository: Repository<Business>) {}

  async findAllPaginated(
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<Business>> {
    const qb = this.repository.createQueryBuilder("business");
    qb.where("business.deletedAt IS NULL");

    // Handle simple search if provided (searches all text fields)
    if (query.search) {
      qb.andWhere("business.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return executePaginatedQuery(qb, query, BUSINESS_MAPPING.fields, "business");
  }

  async findById(id: string): Promise<Business | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async getById(id: string): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }
    return business;
  }

  async findByName(name: string): Promise<Business | null> {
    return this.repository.findOne({
      where: { name, deletedAt: IsNull() },
    });
  }

  async create(data: ICreateBusiness): Promise<Business> {
    try {
      const business = this.repository.create(data);
      return this.repository.save(business);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Business with this name already exists");
      }
      throw error;
    }
  }

  async update(id: string, data: IUpdateBusiness): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }

    try {
      await this.repository.update(id, data);
      const updated = await this.findById(id);
      if (!updated) {
        throw new NotFoundError("Business not found after update");
      }
      return updated;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Business with this name already exists");
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }
    await this.repository.update(id, { deletedAt: new Date() });
  }
}
