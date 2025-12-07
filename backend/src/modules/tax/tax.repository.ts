import { IsNull, type Repository } from "typeorm";
import type { Tax } from "./tax.entity";
import type { ICreateTax, IUpdateTax } from "./tax.types";

export class TaxRepository {
  constructor(private repository: Repository<Tax>) {}

  async findAll(): Promise<Tax[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: "ASC" },
      relations: ["country"],
    });
  }

  async findById(id: string): Promise<Tax | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["country"],
    });
  }

  async findByCountryId(countryId: string): Promise<Tax[]> {
    return this.repository.find({
      where: { countryId, deletedAt: IsNull() },
      order: { name: "ASC" },
      relations: ["country"],
    });
  }

  async create(data: ICreateTax): Promise<Tax> {
    const tax = this.repository.create(data);
    return this.repository.save(tax);
  }

  async update(id: string, data: IUpdateTax): Promise<Tax | null> {
    await this.repository.update({ id, deletedAt: IsNull() }, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
  }

  async deleteByCountryId(countryId: string): Promise<void> {
    await this.repository.update(
      { countryId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
  }
}
