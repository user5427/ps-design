import type { Repository } from "typeorm";
import type { RoleScope } from "./role-scope.entity";
import { ScopeNames } from "./scope.types";

export class RoleScopeRepository {
  constructor(private repository: Repository<RoleScope>) {}

  /**
   * Get all scope names for a specific role
   */
  async getScopeNamesForRole(roleId: string): Promise<ScopeNames[]> {
    const roleScopes = await this.repository.find({
      where: { roleId },
      relations: ["scope"],
    });
    return roleScopes.map((rs) => rs.scope.name as ScopeNames);
  }

  /**
   * Get all scopes for a specific role with details
   */
  async getScopesForRole(roleId: string): Promise<RoleScope[]> {
    return this.repository.find({
      where: { roleId },
      relations: ["scope"],
    });
  }

  /**
   * Assign a scope to a role
   */
  async assignScope(roleId: string, scopeName: ScopeNames): Promise<RoleScope> {
    // Find the scope entity by name
    const scope = await this.repository.manager
      .getRepository("ScopeEntity")
      .findOne({ where: { name: scopeName } });

    if (!scope) {
      throw new Error(`Scope ${scopeName} not found`);
    }

    const roleScope = this.repository.create({
      roleId,
      scopeId: scope.id,
    });
    return this.repository.save(roleScope);
  }

  /**
   * Remove a specific scope from a role
   */
  async removeScope(roleId: string, scopeName: ScopeNames): Promise<void> {
    // Find the scope entity by name
    const scope = await this.repository.manager
      .getRepository("ScopeEntity")
      .findOne({ where: { name: scopeName } });

    if (!scope) {
      throw new Error(`Scope ${scopeName} not found`);
    }

    await this.repository.delete({
      roleId,
      scopeId: scope.id,
    });
  }

  /**
   * Remove all scopes from a role
   */
  async removeAllScopes(roleId: string): Promise<void> {
    await this.repository.delete({
      roleId,
    });
  }

  /**
   * Check if a role has a specific scope
   */
  async hasScope(roleId: string, scopeName: ScopeNames): Promise<boolean> {
    // Find the scope entity by name
    const scope = await this.repository.manager
      .getRepository("ScopeEntity")
      .findOne({ where: { name: scopeName } });

    if (!scope) {
      return false;
    }

    const result = await this.repository.findOne({
      where: { roleId, scopeId: scope.id },
    });
    return !!result;
  }
}
