import type { Repository } from "typeorm";
import type { UserRole } from "./user-role.entity";

export class UserRoleRepository {
  constructor(private repository: Repository<UserRole>) {}

  /**
   * Get all role IDs for a specific user
   */
  async getRoleIdsForUser(userId: string): Promise<string[]> {
    const userRoles = await this.repository.find({
      where: { userId },
      select: ["roleId"],
    });
    return userRoles.map((ur) => ur.roleId);
  }

  /**
   * Get all roles for a specific user with details
   */
  async getRolesForUser(userId: string): Promise<UserRole[]> {
    return this.repository.find({
      where: { userId },
      relations: ["role"],
    });
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string): Promise<UserRole> {
    const userRole = this.repository.create({
      userId,
      roleId,
    });
    return this.repository.save(userRole);
  }

  /**
   * Remove a specific role from a user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.repository.delete({
      userId,
      roleId,
    });
  }

  /**
   * Remove all roles from a user
   */
  async removeAllRoles(userId: string): Promise<void> {
    await this.repository.delete({
      userId,
    });
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const result = await this.repository.findOne({
      where: { userId, roleId },
    });
    return !!result;
  }

  /**
   * Get all users with a specific role
   */
  async getUsersWithRole(roleId: string): Promise<UserRole[]> {
    return this.repository.find({
      where: { roleId },
      relations: ["user"],
    });
  }
}
