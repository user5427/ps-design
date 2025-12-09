import type { Repository } from "typeorm";
import type { Role } from "./role.entity";

export class RoleRepository {
  constructor(private repository: Repository<Role>) {}

  async findAll(): Promise<Role[]> {
    return this.repository.find({
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    const role = this.repository.create({
      name: data.name,
      description: data.description ?? null,
    });
    return this.repository.save(role);
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Role | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
