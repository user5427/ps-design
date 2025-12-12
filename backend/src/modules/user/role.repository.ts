import type { Repository } from "typeorm";
import type { Role } from "./role.entity";
import type { ScopeNames } from "./scope.types";

export class RoleRepository {
  constructor(private repository: Repository<Role>) {}

  async findAll(): Promise<Role[]> {
    return this.repository.find({
      order: { name: "ASC" },
    });
  }

  async findByBusinessId(businessId: string): Promise<Role[]> {
    return this.repository.find({
      where: { businessId },
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

  async findByBusinessAndName(
    businessId: string,
    name: string,
  ): Promise<Role | null> {
    return this.repository.findOne({
      where: { businessId, name },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    businessId: string;
    isSystemRole?: boolean;
    isDeletable?: boolean;
  }): Promise<Role> {
    const role = this.repository.create({
      name: data.name,
      description: data.description ?? null,
      businessId: data.businessId,
      isSystemRole: data.isSystemRole ?? false,
      isDeletable: data.isDeletable ?? true,
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
    const role = await this.findById(id);
    if (!role) {
      throw new Error("Role not found");
    }
    if (!role.isDeletable) {
      throw new Error("This role cannot be deleted");
    }
    await this.repository.delete(id);
  }

  async getUserScopesFromRoles(roleIds: string[]): Promise<ScopeNames[]> {
    if (roleIds.length === 0) return [];

    const roles = await this.repository.find({
      where: roleIds.map((id) => ({ id })),
      relations: ["roleScopes", "roleScopes.scope"],
    });

    const scopeSet = new Set<ScopeNames>();
    for (const role of roles) {
      for (const roleScope of role.roleScopes) {
        scopeSet.add(roleScope.scope.name as ScopeNames);
      }
    }

    return Array.from(scopeSet);
  }
}
