import { IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { IPaginatedResult } from "@/shared/pagination";
import type { Business } from "./business.entity";
import type { ICreateBusiness, IUpdateBusiness } from "./business.types";

export class BusinessRepository {
  constructor(private repository: Repository<Business>) {}

  async findAll(): Promise<Business[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: "ASC" },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<Business>> {
    const [items, total] = await this.repository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { name: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      pages,
    };
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
