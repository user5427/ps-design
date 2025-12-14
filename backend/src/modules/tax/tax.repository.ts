import { IsNull, type Repository } from "typeorm";
import type { Tax } from "./tax.entity";
import type { ICreateTax, IUpdateTax } from "./tax.types";
import { Category } from "../category";


export class TaxRepository {
  constructor(private repository: Repository<Tax>, private categoryRepository: Repository<Category>) {}

  async findAll(): Promise<Tax[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: "ASC" },
    });
  }

  async findAllByBusinessId(businessId: string): Promise<Tax[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      order: { name: "ASC" },
    });
  }

  async getById(id: string, businessId: string): Promise<Tax | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async create(data: ICreateTax): Promise<Tax> {
    const tax = this.repository.create(data);
    return this.repository.save(tax);
  }

  async update(id: string, businessId: string, data: IUpdateTax): Promise<Tax | null> {
    await this.repository.update({ id, businessId, deletedAt: IsNull() }, data);
    return this.getById(id, businessId);
  }

  async softDelete(id: string, businessId: string): Promise<void> {
    await this.repository.update(
      { id, businessId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    // Unlink tax from categories
    await this.categoryRepository
      .createQueryBuilder()
      .update()
      .set({ taxId: null })
      .where("taxId = :taxId", { taxId: id })
      .andWhere("businessId = :businessId", { businessId })
      .execute();
  }
}
