import type { Repository } from "typeorm";
import type { ScopeEntity } from "./scope.entity";

export class ScopeRepository {
  constructor(private repository: Repository<ScopeEntity>) {}

  async findAll(): Promise<ScopeEntity[]> {
    return this.repository.find({
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<ScopeEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<ScopeEntity | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    description?: string;
  }): Promise<ScopeEntity> {
    const scope = this.repository.create({
      name: data.name,
      description: data.description ?? null,
    });
    return this.repository.save(scope);
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<ScopeEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
