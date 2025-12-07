import { IsNull, type Repository } from "typeorm";
import type { Country } from "./country.entity";
import type { ICreateCountry, IUpdateCountry } from "./country.types";

export class CountryRepository {
  constructor(private repository: Repository<Country>) {}

  async findAll(): Promise<Country[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: "ASC" },
      relations: ["taxes"],
    });
  }

  async findById(id: string): Promise<Country | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["taxes"],
    });
  }

  async findByCode(code: string): Promise<Country | null> {
    return this.repository.findOne({
      where: { code, deletedAt: IsNull() },
      relations: ["taxes"],
    });
  }

  async create(data: ICreateCountry): Promise<Country> {
    const country = this.repository.create(data);
    return this.repository.save(country);
  }

  async update(id: string, data: IUpdateCountry): Promise<Country | null> {
    await this.repository.update({ id, deletedAt: IsNull() }, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() }
    );
  }
}
