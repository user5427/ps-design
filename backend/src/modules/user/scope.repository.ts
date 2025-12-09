import type { Repository } from "typeorm";
import type { Scope } from "./scope.entity";

export class ScopeRepository {
  constructor(private repository: Repository<Scope>) {}

  async findAll(): Promise<Scope[]> {
    return this.repository.find({
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<Scope | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Scope | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string }): Promise<Scope> {
    const scope = this.repository.create({
      name: data.name,
      description: data.description ?? null,
    });
    return this.repository.save(scope);
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Scope | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
