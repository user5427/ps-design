# Fastify-Awilix Implementation Guide: Code Examples

Concrete, production-ready code examples for implementing scoped DI with authorization in your PS-Design backend.

---

## Part 1: Container Setup

### File: `backend/src/plugins/di/container.ts`

```typescript
import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix'
import type { FastifyInstance } from 'fastify'

/**
 * Create and configure the DI container for the application.
 * This container holds all app-level (singleton) registrations.
 */
export function createDIContainer() {
  return createContainer({
    strict: true, // Prevent lifetime mismatches
    injectionMode: 'PROXY', // Use proxy injection mode (more flexible)
  })
}

/**
 * Register all app-level (singleton) dependencies.
 * These are resolved once and reused for the entire app lifecycle.
 */
export function registerAppLevelServices(
  diContainer: ReturnType<typeof createContainer>,
  fastify: FastifyInstance,
) {
  diContainer.register({
    // Repositories (singleton - shared across requests)
    userRepository: asClass(UserRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    roleRepository: asClass(RoleRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    inventoryRepository: asClass(InventoryRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    productRepository: asClass(ProductRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    productUnitRepository: asClass(ProductUnitRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    roleScopeRepository: asClass(RoleScopeRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    
    // Logger (provide fastify's logger)
    logger: asValue(fastify.log),
    
    // Database connection (already on fastify instance)
    db: asValue(fastify.db),
  })
}
```

### File: `backend/src/plugins/di/cradle-types.ts`

```typescript
import type { ScopeChecker } from '@/shared/scope-checker'
import type { IAuthUser } from '@/modules/user'
import type { ScopeNames } from '@/modules/user/user.scope.types'
import type {
  UserRepository,
  RoleRepository,
  InventoryRepository,
} from '@/modules' // adjust import path

/**
 * TypeScript type definitions for DI container (app-level).
 * Extends the awilix Cradle interface for full type support.
 */
declare module '@fastify/awilix' {
  interface Cradle {
    // Repositories
    userRepository: UserRepository
    roleRepository: RoleRepository
    inventoryRepository: InventoryRepository
    productRepository: ProductRepository
    productUnitRepository: ProductUnitRepository
    roleScopeRepository: RoleScopeRepository

    // Utils
    logger: FastifyInstance['log']
    db: FastifyInstance['db']
  }

  /**
   * Request-scoped dependencies.
   * These are created fresh for each request.
   */
  interface RequestCradle extends Cradle {
    // Current request context
    currentUser: IAuthUser

    // Pre-fetched and cached user scopes (fetched once per request)
    userScopes: Set<ScopeNames>

    // Services with request context built-in
    scopeChecker: ScopeChecker
  }
}
```

---

## Part 2: Request Scope Setup

### File: `backend/src/plugins/di/request-scope.ts`

```typescript
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { asClass, asFunction, asValue, Lifetime } from 'awilix'
import type { ScopeNames } from '@/modules/user/user.scope.types'
import { ScopeChecker } from '@/shared/scope-checker'

/**
 * Setup request-scoped DI registrations.
 * Called once per request via onRequest hook.
 * 
 * This is where we:
 * 1. Register the current user
 * 2. Cache their scopes (prevents N+1 queries)
 * 3. Create request-scoped services
 */
export function setupRequestScopeDI(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Register current authenticated user (available after auth middleware)
    request.diScope.register({
      currentUser: asValue(request.authUser),
    })

    // Register pre-fetched user scopes (cached per request)
    // This runs once per request and subsequent scope checks are O(1)
    request.diScope.register({
      userScopes: asFunction(
        async ({ currentUser, roleScopeRepository }) => {
          if (!currentUser) {
            return new Set<ScopeNames>()
          }

          // Fetch all scopes for user's roles (single query!)
          const scopeSets = await Promise.all(
            currentUser.roleIds.map((roleId) =>
              roleScopeRepository.getScopeNamesForRole(roleId),
            ),
          )

          // Combine into single set
          return new Set(scopeSets.flat())
        },
      ).scoped(), // Scoped: runs once per request, result is cached
    })

    // Register enhanced ScopeChecker that uses cached scopes
    request.diScope.register({
      scopeChecker: asClass(ScopeChecker).scoped(),
    })

    // Optional: Register other request-scoped services
    // Example: Services that need businessId from current user
    request.diScope.register({
      currentBusinessId: asValue(currentUser?.businessId),
    })
  })
}
```

### File: `backend/src/shared/scope-checker.ts` (Enhanced for DI)

```typescript
import type { ScopeNames } from '@/modules/user/user.scope.types'
import type { IAuthUser } from '@/modules/user'
import HttpStatus from 'http-status'

/**
 * Enhanced ScopeChecker designed for DI injection.
 * 
 * Key improvement: Scopes are pre-fetched and cached per request,
 * so all checks are O(1) instead of O(N) database queries.
 * 
 * Receives dependencies via constructor injection:
 * - currentUser: From request context
 * - userScopes: Pre-cached Set of scopes (fetched once per request)
 */
export class ScopeChecker {
  constructor(
    private currentUser: IAuthUser | undefined,
    private userScopes: Set<ScopeNames>,
  ) {}

  /**
   * Check if user has a single scope.
   * O(1) operation - just a Set lookup!
   */
  hasScope(scope: ScopeNames): boolean {
    if (!this.currentUser) {
      return false
    }
    return this.userScopes.has(scope)
  }

  /**
   * Check if user has all provided scopes.
   */
  hasAllScopes(...scopes: ScopeNames[]): boolean {
    if (!this.currentUser) {
      return false
    }
    return scopes.every((scope) => this.userScopes.has(scope))
  }

  /**
   * Check if user has at least one of the provided scopes.
   */
  hasAnyScope(...scopes: ScopeNames[]): boolean {
    if (!this.currentUser) {
      return false
    }
    return scopes.some((scope) => this.userScopes.has(scope))
  }

  /**
   * Verify user has required scope, throw 403 if missing.
   * @throws 401 if not authenticated, 403 if scope missing
   */
  requireScope(scope: ScopeNames): IAuthUser {
    if (!this.currentUser) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }
    }

    if (!this.userScopes.has(scope)) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Insufficient permissions. Required: ${scope}`,
      }
    }

    return this.currentUser
  }

  /**
   * Verify user has all required scopes, throw 403 if missing any.
   */
  requireAllScopes(...scopes: ScopeNames[]): IAuthUser {
    if (!this.currentUser) {
      throw {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }
    }

    const missing = scopes.filter((s) => !this.userScopes.has(s))
    if (missing.length > 0) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Insufficient permissions. Required: ${missing.join(', ')}`,
      }
    }

    return this.currentUser
  }

  /**
   * Get all scopes the user has.
   */
  getAllScopes(): Set<ScopeNames> {
    return new Set(this.userScopes)
  }

  /**
   * Get the current user.
   */
  getCurrentUser(): IAuthUser | undefined {
    return this.currentUser
  }
}
```

---

## Part 3: Authorization Middleware & Decorators

### File: `backend/src/plugins/app/authorization-guards.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import HttpStatus from 'http-status'
import type { ScopeNames } from '@/modules/user/user.scope.types'

/**
 * Guard factory: Creates middleware that requires specific scopes.
 * Can be used as route preHandler.
 * 
 * Usage:
 *   const readGuard = createScopeGuard(ScopeNames.INVENTORY_READ)
 *   server.get('/items', { preHandler: readGuard }, handler)
 */
export function createScopeGuard(...requiredScopes: ScopeNames[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')

    const hasPermission = requiredScopes.length === 1
      ? scopeChecker.hasScope(requiredScopes[0])
      : scopeChecker.hasAllScopes(...requiredScopes)

    if (!hasPermission) {
      return reply.code(HttpStatus.FORBIDDEN).send({
        message: 'Insufficient permissions',
        required: requiredScopes,
      })
    }
  }
}

/**
 * Guard for "any of" multiple scopes.
 * 
 * Usage: User needs EITHER read OR admin scope
 *   const anyGuard = createAnyScopeGuard(
 *     ScopeNames.INVENTORY_READ,
 *     ScopeNames.USER_WRITE
 *   )
 */
export function createAnyScopeGuard(...requiredScopes: ScopeNames[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')

    if (!scopeChecker.hasAnyScope(...requiredScopes)) {
      return reply.code(HttpStatus.FORBIDDEN).send({
        message: 'Insufficient permissions',
        required: requiredScopes,
      })
    }
  }
}

/**
 * Utility to get scope checker in handlers.
 * 
 * Usage:
 *   const scopeChecker = getScopeChecker(request)
 *   const user = scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
 */
export function getScopeChecker(request: FastifyRequest) {
  return request.diScope.resolve('scopeChecker')
}

/**
 * Utility to require scope and get user in one call.
 * Throws 403 if missing scope.
 * 
 * Usage:
 *   const user = await requireScope(request, ScopeNames.INVENTORY_WRITE)
 */
export async function requireScope(
  request: FastifyRequest,
  scope: ScopeNames,
) {
  const scopeChecker = getScopeChecker(request)
  return scopeChecker.requireScope(scope)
}

/**
 * Utility for multiple scopes.
 */
export async function requireAllScopes(
  request: FastifyRequest,
  ...scopes: ScopeNames[]
) {
  const scopeChecker = getScopeChecker(request)
  return scopeChecker.requireAllScopes(...scopes)
}
```

---

## Part 4: Route File Example

### File: `backend/src/routes/api/inventory/items/index.ts`

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import HttpStatus from 'http-status'
import { ScopeNames } from '@/modules/user/user.scope.types'
import { createScopeGuard, requireScope } from '@/plugins/app/authorization-guards'

export default async function inventoryItemsRoutes(
  fastify: FastifyInstance,
) {
  const server = fastify.withTypeProvider<ZodTypeProvider>()

  // Create guards (define once, reuse)
  const readGuard = createScopeGuard(ScopeNames.INVENTORY_READ)
  const writeGuard = createScopeGuard(ScopeNames.INVENTORY_WRITE)
  const deleteGuard = createScopeGuard(ScopeNames.INVENTORY_DELETE)

  /**
   * GET /api/inventory/items
   * Requires: INVENTORY_READ scope
   * 
   * Uses middleware guard - scope already checked before handler runs
   */
  server.get(
    '/',
    {
      preHandler: readGuard,
      schema: {
        response: {
          200: GetItemsResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Scope already verified by guard!
        // Just resolve and use the service
        const inventoryService = request.diScope.resolve('inventoryService')
        const items = await inventoryService.getItems()
        
        return reply.send(items)
      } catch (err) {
        request.log.error({ err })
        return reply
          .code(HttpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: 'Internal Server Error' })
      }
    },
  )

  /**
   * POST /api/inventory/items
   * Requires: INVENTORY_WRITE scope
   */
  server.post(
    '/',
    {
      preHandler: writeGuard,
      schema: {
        body: CreateItemSchema,
        response: {
          201: ItemResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateItemInput
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const inventoryService = request.diScope.resolve('inventoryService')
        const item = await inventoryService.createItem(request.body)
        
        return reply.code(HttpStatus.CREATED).send(item)
      } catch (err) {
        request.log.error({ err })
        return reply
          .code(HttpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: 'Internal Server Error' })
      }
    },
  )

  /**
   * PUT /api/inventory/items/:itemId
   * Requires: INVENTORY_WRITE scope
   * 
   * Alternative: Using in-handler check
   */
  server.put(
    '/:itemId',
    {
      schema: {
        params: ItemIdParamSchema,
        body: UpdateItemSchema,
        response: {
          200: ItemResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: ItemIdParam
        Body: UpdateItemInput
      }>,
      reply: FastifyReply,
    ) => {
      try {
        // Manual check in handler (if you prefer)
        const user = await requireScope(request, ScopeNames.INVENTORY_WRITE)
        
        const inventoryService = request.diScope.resolve('inventoryService')
        const item = await inventoryService.updateItem(
          request.params.itemId,
          request.body,
        )
        
        return reply.send(item)
      } catch (err) {
        // Catches both authorization errors and business logic errors
        const statusCode = err?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        return reply
          .code(statusCode)
          .send({ message: err?.message || 'Internal Server Error' })
      }
    },
  )

  /**
   * DELETE /api/inventory/items/:itemId
   * Requires: INVENTORY_DELETE scope
   */
  server.delete(
    '/:itemId',
    {
      preHandler: deleteGuard,
      schema: {
        params: ItemIdParamSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ItemIdParam
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const inventoryService = request.diScope.resolve('inventoryService')
        await inventoryService.deleteItem(request.params.itemId)
        
        return reply.code(HttpStatus.NO_CONTENT).send()
      } catch (err) {
        request.log.error({ err })
        return reply
          .code(HttpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: 'Internal Server Error' })
      }
    },
  )
}
```

---

## Part 5: Service Example

### File: `backend/src/services/inventory.service.ts`

```typescript
import type { IAuthUser } from '@/modules/user'
import type { InventoryRepository } from '@/modules/inventory'
import { ScopeChecker } from '@/shared/scope-checker'
import { ScopeNames } from '@/modules/user/user.scope.types'
import HttpStatus from 'http-status'

/**
 * Inventory Service - Request-scoped service with built-in authorization.
 * 
 * This service receives:
 * - currentUser: The authenticated user from the request
 * - inventoryRepository: Database access
 * - scopeChecker: For authorization checks
 * 
 * All injected via constructor (DI container handles this).
 */
export class InventoryService {
  constructor(
    private currentUser: IAuthUser,
    private inventoryRepository: InventoryRepository,
    private scopeChecker: ScopeChecker,
  ) {}

  /**
   * Get all inventory for current user's business.
   * Internally verifies INVENTORY_READ scope.
   */
  async getItems() {
    // Verify scope (throws 403 if missing)
    this.scopeChecker.requireScope(ScopeNames.INVENTORY_READ)

    // Fetch from database
    const items = await this.inventoryRepository.findByBusinessId(
      this.currentUser.businessId,
    )

    return items
  }

  /**
   * Create new inventory item.
   * Requires: INVENTORY_WRITE scope
   */
  async createItem(input: CreateItemInput) {
    // Verify scope
    this.scopeChecker.requireScope(ScopeNames.INVENTORY_WRITE)

    // Create with current user's business context
    const item = await this.inventoryRepository.create({
      ...input,
      businessId: this.currentUser.businessId,
      createdBy: this.currentUser.id,
    })

    return item
  }

  /**
   * Update inventory item.
   * Requires: INVENTORY_WRITE scope
   */
  async updateItem(itemId: string, input: UpdateItemInput) {
    this.scopeChecker.requireScope(ScopeNames.INVENTORY_WRITE)

    const item = await this.inventoryRepository.findById(
      itemId,
      this.currentUser.businessId,
    )

    if (!item) {
      throw {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      }
    }

    return this.inventoryRepository.update(itemId, input)
  }

  /**
   * Delete inventory item.
   * Requires: INVENTORY_DELETE scope
   */
  async deleteItem(itemId: string) {
    this.scopeChecker.requireScope(ScopeNames.INVENTORY_DELETE)

    await this.inventoryRepository.delete(itemId, this.currentUser.businessId)
  }
}
```

---

## Part 6: Integration in app.ts

### File: `backend/src/app.ts` (Partial - DI Setup)

```typescript
import fastifyAutoLoad from '@fastify/autoload'
import type {
  FastifyError,
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import HttpStatus from 'http-status'
import path from 'path'
import {
  createDIContainer,
  registerAppLevelServices,
} from './plugins/di/container'
import { setupRequestScopeDI } from './plugins/di/request-scope'

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  // Setup Zod validation (existing)
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // ===== DI SETUP =====
  // Create DI container
  const diContainer = createDIContainer()

  // Register app-level services (singletons)
  registerAppLevelServices(diContainer, fastify)

  // Register awilix plugin with our container
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
    disposeOnClose: true,
    disposeOnResponse: true,
  })

  // Setup request-scoped DI registrations
  setupRequestScopeDI(fastify)

  // ===== REST OF APP SETUP =====
  const autoLoad = (dir: string, extraOptions: object = {}) =>
    fastify.register(fastifyAutoLoad, {
      dir: path.join(__dirname, dir),
      options: { ...opts, ...extraOptions },
      autoHooks: true,
      cascadeHooks: true,
    })

  // Load plugins (external, then app-level)
  await autoLoad('plugins/external', {})
  await autoLoad('plugins/app')

  // Authentication hook (existing)
  fastify.addHook('onRequest', async (request, reply) => {
    const publicPrefixes = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api-docs',
    ]

    if (publicPrefixes.some((prefix) => request.url.startsWith(prefix))) {
      return
    }

    await fastify.authenticate(request, reply)
  })

  // Load routes
  await autoLoad('routes')

  // Error handler (existing)
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error(
        {
          error,
          request: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
          },
        },
        'Unhandled error occurred',
      )

      const status = error.statusCode ?? 500
      reply.code(status).send({
        message: status < 500 ? error.message : 'Internal Server Error',
      })
    },
  )

  // 404 handler (existing)
  fastify.setNotFoundHandler({
    preHandler: fastify.rateLimit({
      max: 3,
      timeWindow: 500,
    }),
    async (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
          },
        },
        'Resource not found',
      )
      reply.code(HttpStatus.NOT_FOUND).send({ message: 'Not Found' })
    },
  })
}
```

---

## Part 7: Testing Example

### File: `backend/src/__tests__/scope-checker.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createContainer, asValue, Lifetime } from 'awilix'
import { ScopeChecker } from '@/shared/scope-checker'
import { ScopeNames } from '@/modules/user/user.scope.types'
import type { IAuthUser } from '@/modules/user'

describe('ScopeChecker (DI Mode)', () => {
  let scopeChecker: ScopeChecker
  let mockUser: IAuthUser

  beforeEach(() => {
    // Setup
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
      businessId: 'business-456',
      roleIds: ['role-1', 'role-2'],
    }

    // Create a test scope
    const container = createContainer()
    const testScope = container.createScope()

    // Register test dependencies
    testScope.register({
      currentUser: asValue(mockUser),
      userScopes: asValue(
        new Set([
          ScopeNames.INVENTORY_READ,
          ScopeNames.INVENTORY_WRITE,
          ScopeNames.USER_READ,
        ]),
      ),
    })

    // Resolve ScopeChecker with test dependencies
    scopeChecker = testScope.resolve('scopeChecker')
  })

  describe('hasScope', () => {
    it('should return true if user has scope', () => {
      const result = scopeChecker.hasScope(ScopeNames.INVENTORY_READ)
      expect(result).toBe(true)
    })

    it('should return false if user lacks scope', () => {
      const result = scopeChecker.hasScope(ScopeNames.INVENTORY_DELETE)
      expect(result).toBe(false)
    })
  })

  describe('hasAllScopes', () => {
    it('should return true if user has all scopes', () => {
      const result = scopeChecker.hasAllScopes(
        ScopeNames.INVENTORY_READ,
        ScopeNames.INVENTORY_WRITE,
      )
      expect(result).toBe(true)
    })

    it('should return false if user lacks any scope', () => {
      const result = scopeChecker.hasAllScopes(
        ScopeNames.INVENTORY_READ,
        ScopeNames.INVENTORY_DELETE,
      )
      expect(result).toBe(false)
    })
  })

  describe('requireScope', () => {
    it('should return user if scope exists', () => {
      const result = scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
      expect(result).toBe(mockUser)
    })

    it('should throw 403 if scope missing', () => {
      expect(() => {
        scopeChecker.requireScope(ScopeNames.INVENTORY_DELETE)
      }).toThrow()
    })
  })

  describe('Test with no user', () => {
    beforeEach(() => {
      const container = createContainer()
      const testScope = container.createScope()

      testScope.register({
        currentUser: asValue(undefined),
        userScopes: asValue(new Set()),
      })

      scopeChecker = testScope.resolve('scopeChecker')
    })

    it('should deny all scopes for undefined user', () => {
      expect(scopeChecker.hasScope(ScopeNames.INVENTORY_READ)).toBe(false)
    })

    it('should throw 401 on requireScope', () => {
      expect(() => {
        scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
      }).toThrow()
    })
  })
})
```

---

## Part 8: Migration Checklist

```markdown
# Fastify-Awilix Migration Checklist

## Phase 1: Setup (1-2 hours)
- [ ] Install @fastify/awilix and awilix
- [ ] Create plugins/di/ directory structure
- [ ] Create container.ts with basic registrations
- [ ] Create cradle-types.ts with TypeScript interfaces
- [ ] Create request-scope.ts with onRequest hook
- [ ] Update app.ts to register awilix plugin
- [ ] Verify app still starts without errors

## Phase 2: Authorization Guards (2-3 hours)
- [ ] Create plugins/app/authorization-guards.ts
- [ ] Implement createScopeGuard() function
- [ ] Implement createAnyScopeGuard() function
- [ ] Create test file for guards
- [ ] Update 1-2 route files to use new guards
- [ ] Test authorization via curl/Postman

## Phase 3: Service Integration (3-4 hours)
- [ ] Create or update InventoryService with DI
- [ ] Register service in container
- [ ] Update route file to use service
- [ ] Create service unit tests
- [ ] Test end-to-end via API

## Phase 4: Gradual Migration (Ongoing)
- [ ] Create all other services (follow same pattern)
- [ ] Register all repositories in container
- [ ] Update all route files one by one
- [ ] Run full test suite
- [ ] Document patterns in README

## Phase 5: Documentation & Cleanup (1-2 hours)
- [ ] Update backend README with DI patterns
- [ ] Create examples directory with sample code
- [ ] Remove old manual instantiation patterns
- [ ] Code review and cleanup
```

---

## Summary of Key Benefits

✅ **Performance**: Scopes cached per request → O(1) lookups instead of N queries  
✅ **Type Safety**: Full TypeScript support via Cradle interfaces  
✅ **Testability**: Easy to mock via test scope creation  
✅ **Reusability**: Guards and utilities work across all routes  
✅ **Maintainability**: Clear separation of concerns  
✅ **Scalability**: Works for simple and complex authorization logic  

---

**Ready to implement? Start with Part 1 & 2, then gradually add routes from Part 4 one at a time!**
