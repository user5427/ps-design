import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import HttpStatus from "http-status";
import type { IAuthUser } from "../modules/user/user.types";
import type { ScopeNames } from "../modules/user/scope.types";

/**
 * Request-scoped service that checks if the current user's roles have required scopes.
 * Must be injected with current request context to access user data.
 */
export class ScopeChecker {
  private user: IAuthUser | undefined;
  private fastify: FastifyInstance;

  constructor(request: FastifyRequest, fastify: FastifyInstance) {
    this.user = request.authUser;
    this.fastify = fastify;
  }

  /**
   * Get all scope names that user's roles have
   */
  private async getUserScopes(): Promise<Set<ScopeNames>> {
    if (!this.user || !this.user.roleIds.length) {
      return new Set();
    }

    const scopeSets = await Promise.all(
      this.user.roleIds.map((roleId) =>
        this.fastify.db.roleScope.getScopeNamesForRole(roleId),
      ),
    );

    // Combine all scopes from all roles
    return new Set(scopeSets.flat());
  }

  /**
   * Check if user's roles have a single scope
   * @returns boolean true if any role has the scope
   */
  async hasScope(scope: ScopeNames): Promise<boolean> {
    if (!this.user) {
      return false;
    }
    const userScopes = await this.getUserScopes();
    return userScopes.has(scope);
  }

  /**
   * Check if user's roles have all provided scopes
   * @returns boolean true if all scopes are covered by user's roles
   */
  async hasAllScopes(...scopes: ScopeNames[]): Promise<boolean> {
    if (!this.user) {
      return false;
    }
    const userScopes = await this.getUserScopes();
    return scopes.every((scope) => userScopes.has(scope));
  }

  /**
   * Check if user's roles have at least one of the provided scopes
   * @returns boolean true if at least one scope is covered by user's roles
   */
  async hasAnyScope(...scopes: ScopeNames[]): Promise<boolean> {
    if (!this.user) {
      return false;
    }
    const userScopes = await this.getUserScopes();
    return scopes.some((scope) => userScopes.has(scope));
  }

  /**
   * Verify user's roles have required scope, throw 403 if missing
   * @throws 401 if not authenticated, 403 if roles missing scope
   * @returns user object if valid
   */
  async requireScope(scope: ScopeNames): Promise<IAuthUser> {
    if (!this.user) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      };
    }
    const hasScope = await this.hasScope(scope);
    if (!hasScope) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: "Insufficient permissions",
      };
    }
    return this.user;
  }

  /**
   * Verify user's roles have all required scopes, throw 403 if missing any
   * @throws 401 if not authenticated, 403 if roles missing any scope
   * @returns user object if valid
   */
  async requireAllScopes(...scopes: ScopeNames[]): Promise<IAuthUser> {
    if (!this.user) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      };
    }
    const hasAllScopes = await this.hasAllScopes(...scopes);
    if (!hasAllScopes) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: "Insufficient permissions",
      };
    }
    return this.user;
  }

  /**
   * Verify user's roles have at least one of the required scopes, throw 403 if missing all
   * @throws 401 if not authenticated, 403 if roles missing all scopes
   * @returns user object if valid
   */
  async requireAnyScope(...scopes: ScopeNames[]): Promise<IAuthUser> {
    if (!this.user) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      };
    }
    const hasAnyScope = await this.hasAnyScope(...scopes);
    if (!hasAnyScope) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: "Insufficient permissions",
      };
    }
    return this.user;
  }
}
