import type { FastifyRequest } from "fastify";
import HttpStatus from "http-status";
import type { IAuthUser } from "@/modules/user/user.types";
import { ScopeChecker } from "./scope-checker";
import type { ScopeNames } from "@/modules/user/user.scope.types";

/**
 * ScopeGuard factory
 * Usage: Inject into handler and use like @RequireScopes([...]) in FastAPI
 */
export class ScopeGuard {
  private checker: ScopeChecker;
  private user: IAuthUser;

  constructor(request: FastifyRequest) {
    this.checker = new ScopeChecker(request, request.server);
    const authUser = request.authUser;
    if (!authUser) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      };
    }
    this.user = authUser;
  }

  /**
   * Check if user has a single scope
   */
  async hasScope(scope: ScopeNames): Promise<boolean> {
    return this.checker.hasScope(scope);
  }

  /**
   * Check if user has all scopes
   */
  async hasAllScopes(...scopes: ScopeNames[]): Promise<boolean> {
    return this.checker.hasAllScopes(...scopes);
  }

  /**
   * Check if user has any scope
   */
  async hasAnyScope(...scopes: ScopeNames[]): Promise<boolean> {
    return this.checker.hasAnyScope(...scopes);
  }

  /**
   * Require a single scope (throws if missing)
   */
  async requireScope(scope: ScopeNames): Promise<IAuthUser> {
    return this.checker.requireScope(scope);
  }

  /**
   * Require all scopes (throws if missing any)
   */
  async requireAllScopes(...scopes: ScopeNames[]): Promise<IAuthUser> {
    return this.checker.requireAllScopes(...scopes);
  }

  /**
   * Require any scope (throws if missing all)
   */
  async requireAnyScope(...scopes: ScopeNames[]): Promise<IAuthUser> {
    return this.checker.requireAnyScope(...scopes);
  }

  /**
   * Get the authenticated user
   */
  getUser(): IAuthUser {
    return this.user;
  }
}

/**
 * Factory function for awilix DI - creates request-scoped ScopeGuard
 * Register in DI container as: container.register({
 *   scopeGuard: asFunction((c) => scopeGuardFactory(c)).scoped(),
 * })
 */
export const scopeGuardFactory = (cradle: any) => {
  const request = cradle.request as FastifyRequest;
  return new ScopeGuard(request);
};
