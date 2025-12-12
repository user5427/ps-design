# Fastify-Awilix Scoped DI & Authorization Patterns: Feasibility Analysis

**Date**: December 9, 2025  
**Context**: PS-Design Backend (TypeScript + Fastify + TypeORM)

---

## Executive Summary

**Feasibility**: ✅ **HIGHLY FEASIBLE**

Fastify-awilix provides robust support for request-scoped dependency injection that can be leveraged for FastAPI-style scope-based authorization. The approach is production-ready, with clear patterns for:
- Creating request-scoped DI containers
- Injecting request-context dependencies (current user, scopes, etc.)
- Building custom decorators/hooks for scope checking
- Implementing clean authorization middleware

The current implementation using `ScopeChecker` class can be evolved into a more elegant DI-driven pattern while maintaining backward compatibility.

---

## 1. How to Create Request-Scoped DI Factories in Fastify-Awilix

### 1.1 Core Concepts

**Three Lifetime Types:**
- **TRANSIENT**: New instance every resolution (default)
- **SCOPED**: Cached within a scope, new per request
- **SINGLETON**: Cached globally, reused always

### 1.2 Request Scope Registration Pattern

```typescript
// Setup in app initialization
import { fastifyAwilixPlugin } from '@fastify/awilix'
import { asClass, asFunction, asValue, Lifetime } from 'awilix'

app.register(fastifyAwilixPlugin, {
  disposeOnClose: true,
  disposeOnResponse: true,
  strictBooleanEnforced: true
})

// Register app-level singletons
const { diContainer } = require('@fastify/awilix')

diContainer.register({
  // App-level services
  userRepository: asClass(UserRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  
  roleRepository: asClass(RoleRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
})

// Register request-scoped dependencies via onRequest hook
app.addHook('onRequest', (request, reply, done) => {
  request.diScope.register({
    // Request-scoped services
    currentUser: asValue(request.authUser),
    
    scopeChecker: asClass(ScopeChecker, {
      lifetime: Lifetime.SCOPED,
    }),
    
    // Factory function with request context
    userService: asFunction(
      ({ userRepository, currentUser }) => {
        return new UserService(userRepository, currentUser)
      },
      {
        lifetime: Lifetime.SCOPED,
      }
    ),
  })
  done()
})
```

### 1.3 Advanced Pattern: Request-Aware Factory Functions

```typescript
// Define factories that receive request context
interface RequestContext {
  userId: string
  businessId: string
  request: FastifyRequest
}

const createInventoryService = ({ 
  inventoryRepository, 
  currentUser,
  scopeChecker 
}: {
  inventoryRepository: InventoryRepository
  currentUser: IAuthUser
  scopeChecker: ScopeChecker
}) => {
  return {
    async getInventory() {
      // Scope checking happens automatically via scopeChecker
      const hasAccess = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ)
      if (!hasAccess) {
        throw new ForbiddenError('Insufficient permissions')
      }
      return inventoryRepository.getByBusinessId(currentUser.businessId)
    }
  }
}

diContainer.register({
  inventoryService: asFunction(createInventoryService).scoped(),
})
```

### 1.4 Lifetime Safety with Strict Mode

```typescript
// Enable strict mode to catch lifetime mismatches
app.register(fastifyAwilixPlugin, {
  container: container,
  strict: true, // Prevents singleton from depending on scoped
})

// This will error in strict mode (singleton depends on scoped):
diContainer.register({
  cachingService: asClass(CachingService).singleton(), // WRONG!
  // ├─ depends on currentUser: SCOPED
})

// Correct pattern:
diContainer.register({
  cachingService: asClass(CachingService).scoped(), // Shorter lifetime!
  currentUser: asValue(null), // Will be overridden in request scope
})
```

**Key Takeaway**: Request-scoped factories work by creating a new child container per request via `request.diScope`, with automatic cleanup after the response is sent.

---

## 2. Custom Decorators & Hooks for Scope-Based Authorization

### 2.1 Hook-Based Authorization Pattern

```typescript
// Create a generic scope-checking hook
async function createScopeCheckHook(...requiredScopes: ScopeNames[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')
    
    if (!await scopeChecker.hasAllScopes(...requiredScopes)) {
      throw {
        statusCode: httpStatus.FORBIDDEN,
        message: `Required scopes: ${requiredScopes.join(', ')}`,
      }
    }
  }
}

// Usage in routes
server.get(
  '/inventory/items',
  {
    preHandler: await createScopeCheckHook(ScopeNames.INVENTORY_READ),
  },
  async (request, reply) => {
    const inventoryService = request.diScope.resolve('inventoryService')
    const items = await inventoryService.getItems()
    return reply.send(items)
  }
)
```

### 2.2 Decorator Pattern (Cleaner Approach)

```typescript
// Define a reusable decorator factory
function requireScope(...scopes: ScopeNames[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')
    
    const hasPermission = scopes.length > 1
      ? await scopeChecker.hasAllScopes(...scopes)
      : await scopeChecker.hasScope(scopes[0])
    
    if (!hasPermission) {
      return reply
        .code(httpStatus.FORBIDDEN)
        .send({ 
          message: 'Insufficient permissions',
          required: scopes,
        })
    }
  }
}

// Usage with cleaner syntax
const inventoryReadRequired = requireScope(ScopeNames.INVENTORY_READ)
const inventoryWriteRequired = requireScope(ScopeNames.INVENTORY_WRITE)

server.get('/items', { preHandler: inventoryReadRequired }, handler)
server.post('/items', { preHandler: inventoryWriteRequired }, handler)
server.put('/items/:id', { preHandler: inventoryWriteRequired }, handler)
```

### 2.3 Per-Route Scope Provider Pattern

```typescript
// Inject scope checker directly into handlers
server.get(
  '/items',
  async (request: FastifyRequest, reply: FastifyReply) => {
    // Resolve from request scope
    const { scopeChecker, inventoryService } = request.diScope.cradle
    
    // Check scope
    await scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
    
    // Scope already checked, proceed safely
    const items = await inventoryService.getItems()
    return reply.send(items)
  }
)
```

### 2.4 Class-Based Handler Pattern (FastAPI Style)

```typescript
// Define handler classes with scope requirements
class InventoryHandler {
  constructor(
    private scopeChecker: ScopeChecker,
    private inventoryService: InventoryService
  ) {}

  async getItems() {
    await this.scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
    return this.inventoryService.getItems()
  }

  async createItem(input: CreateItemInput) {
    await this.scopeChecker.requireScope(ScopeNames.INVENTORY_WRITE)
    return this.inventoryService.createItem(input)
  }

  async deleteItem(itemId: string) {
    await this.scopeChecker.requireAllScopes(
      ScopeNames.INVENTORY_DELETE,
      ScopeNames.BUSINESS_WRITE
    )
    return this.inventoryService.deleteItem(itemId)
  }
}

// Register handler in DI container
diContainer.register({
  inventoryHandler: asClass(InventoryHandler).scoped(),
})

// Use in route
server.get('/items', async (request, reply) => {
  const handler = request.diScope.resolve('inventoryHandler')
  const items = await handler.getItems()
  return reply.send(items)
})
```

**Key Insight**: Decorators/hooks resolve dependencies from `request.diScope`, providing access to request-scoped services like `currentUser` and `scopeChecker`.

---

## 3. Example Patterns: Scope/Authorization Checking

### 3.1 Pattern A: Middleware-Based Authorization

```typescript
// Generic scope middleware factory
function createScopeMiddleware(requiredScopes: ScopeNames | ScopeNames[]) {
  const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes]
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')
    
    try {
      await scopeChecker.requireAllScopes(...scopes)
    } catch (error) {
      return reply
        .code(httpStatus.FORBIDDEN)
        .send({ message: 'Insufficient permissions' })
    }
  }
}

// Apply to multiple routes
const inventoryScope = createScopeMiddleware([
  ScopeNames.INVENTORY_READ,
  ScopeNames.INVENTORY_WRITE,
])

server.get('/inventory', { preHandler: inventoryScope }, handler1)
server.post('/inventory', { preHandler: inventoryScope }, handler2)
server.put('/inventory/:id', { preHandler: inventoryScope }, handler3)
```

### 3.2 Pattern B: Resolved Service with Built-in Checks

```typescript
// Service with scope checking built-in
class AuthorizedInventoryService {
  constructor(
    private inventory: InventoryRepository,
    private scopeChecker: ScopeChecker
  ) {}

  async getItems() {
    // Check happens here, automatically via injection
    const user = await this.scopeChecker.requireScope(
      ScopeNames.INVENTORY_READ
    )
    return this.inventory.findByBusinessId(user.businessId)
  }

  async createItem(input: CreateItemInput) {
    // Multiple scope check
    const user = await this.scopeChecker.requireAllScopes(
      ScopeNames.INVENTORY_WRITE,
      ScopeNames.BUSINESS_WRITE
    )
    return this.inventory.create(user.businessId, input)
  }
}

// Register scoped service
diContainer.register({
  authorizedInventoryService: asClass(
    AuthorizedInventoryService
  ).scoped(),
})

// In handler - scopes checked automatically
server.get('/items', async (request, reply) => {
  const service = request.diScope.resolve('authorizedInventoryService')
  const items = await service.getItems() // Throws 403 if no permission
  return reply.send(items)
})
```

### 3.3 Pattern C: Conditional Authorization Based on Action

```typescript
// Advanced: Role-action matrix checking
class ScopedAuthorizationService {
  constructor(
    private scopeChecker: ScopeChecker,
    private currentUser: IAuthUser
  ) {}

  async checkAction(resource: string, action: 'READ' | 'WRITE' | 'DELETE') {
    const scope = `${resource}_${action}` as ScopeNames
    return this.scopeChecker.hasScope(scope)
  }

  async requireAction(resource: string, action: string) {
    if (!(await this.checkAction(resource, action as any))) {
      throw {
        statusCode: httpStatus.FORBIDDEN,
        message: `Required: ${resource}:${action}`,
      }
    }
    return this.currentUser
  }

  // Utility for resource scoping
  async filterVisibleResources<T extends { businessId: string }>(
    resources: T[]
  ): Promise<T[]> {
    // Only return resources from user's business
    return resources.filter(
      (r) => r.businessId === this.currentUser.businessId
    )
  }
}

// Usage
server.get('/items/:id', async (request, reply) => {
  const authService = request.diScope.resolve(
    'scopedAuthorizationService'
  )
  
  await authService.requireAction('INVENTORY', 'READ')
  
  const items = await getItems(request.params.id)
  return reply.send(items)
})
```

---

## 4. Limitations & Challenges

### 4.1 Performance Considerations

| Aspect | Impact | Mitigation |
|--------|--------|-----------|
| Scope creation per request | ~0.1-0.5ms overhead | Negligible for most apps; use metrics if concerned |
| Database queries in factories | Slow DI setup | Use `asyncInit` for async initialization only, not in factories |
| Circular scope lookups | Can cause issues | Awilix strict mode prevents; configure properly |
| Memory per scope | Small object overhead | Cleaned up automatically after response |

**Current Implementation Assessment:**
Your `ScopeChecker` class makes database queries for each scope check. Moving to DI could cache these:
```typescript
// Current: Query runs every time
const canRead = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ)

// Better with DI caching:
const userScopes = asFunction(async ({ currentUser, db }) => {
  // This gets cached once per request!
  return db.roleScope.getScopeNamesForUser(currentUser.id)
}).scoped()
```

### 4.2 TypeScript/Developer Experience

**Challenges:**
- Cradle typing requires manual interface declarations
- Deep DI chains can be hard to trace for debugging
- Runtime errors for missing registrations only caught at resolution time

**Solutions:**
```typescript
// Define cradle types once, reuse everywhere
declare module '@fastify/awilix' {
  interface RequestCradle {
    currentUser: IAuthUser
    scopeChecker: ScopeChecker
    inventoryService: InventoryService
    userScopes: Set<ScopeNames>
  }
}

// Now these are all typed:
const { scopeChecker } = request.diScope.cradle // ✅ Typed
request.diScope.resolve('scopeChecker') // ✅ Also typed
```

### 4.3 Testing Challenges

**Issue**: Mocking request-scoped services requires careful setup

**Solution**: 
```typescript
// Helper for testing with DI
function createTestScope(overrides: Partial<RequestCradle> = {}) {
  const scope = diContainer.createScope()
  scope.register({
    currentUser: asValue(overrides.currentUser ?? mockUser),
    scopeChecker: asValue(overrides.scopeChecker ?? mockScopeChecker),
  })
  return scope
}

// In tests:
const scope = createTestScope({
  currentUser: adminUser,
})
const service = scope.resolve('inventoryService')
// Now service runs with admin user context
```

### 4.4 Registration Order Dependencies

**Risk**: Registering services in wrong order can cause resolution failures

**Prevention**:
```typescript
// ✅ Register in dependency order (deepest first)
diContainer.register({
  // Base repositories first
  userRepository: asClass(UserRepository).singleton(),
  
  // Then services that depend on repos
  userService: asClass(UserService).singleton(),
  
  // Then complex services
  authService: asClass(AuthService).singleton(),
})

// ✅ Or use autoloading for automatic ordering
diContainer.loadModules(['services/**/*.ts'], {
  formatName: 'camelCase',
  resolverOptions: { lifetime: Lifetime.SINGLETON }
})
```

### 4.5 Disposing Resources

**Important**: Cleanup on request end

```typescript
// Auto-disposal enabled (recommended)
app.register(fastifyAwilixPlugin, {
  disposeOnResponse: true, // Calls dispose() after response
})

// Define disposal in scoped services:
class DataStore {
  async dispose() {
    // Clean up database connections, file handles, etc.
    await this.connection.close()
  }
}

diContainer.register({
  dataStore: asClass(DataStore).scoped().disposer(
    (module) => module.dispose()
  ),
})
```

### 4.6 Current Implementation Issues

Your current `ScopeChecker` pattern:
```typescript
// Current: Manual instantiation per route
async (request, reply) => {
  const scopeChecker = new ScopeChecker(request, fastify)
  const can = await scopeChecker.hasScope(scope)
}

// Issues:
// - No caching of scope queries (DB hit per check)
// - Manual dependency management
// - Repeated instantiation
// - Hard to test
```

---

## 5. Best Practices for Implementation

### 5.1 Recommended Architecture

```
backend/src/
├── plugins/
│   └── di/
│       ├── container.ts          # Container setup
│       ├── registrations.ts      # All registrations
│       └── cradle-types.ts       # TypeScript types
├── hooks/
│   └── request-scoped.ts         # onRequest hook
├── middleware/
│   └── authorization.ts          # Scope checking middleware
├── services/
│   ├── scope-checker.ts          # (Enhanced version)
│   ├── inventory.service.ts      # Services (scoped)
│   └── user.service.ts
└── modules/
    └── [existing structure...]
```

### 5.2 Container Setup (Recommended)

```typescript
// plugins/di/container.ts
import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix'

export const diContainer = createContainer({
  strict: true,
  injectionMode: 'PROXY',
})

// Register singletons (app-level)
diContainer.register({
  // Repositories
  userRepository: asClass(UserRepository).singleton(),
  roleRepository: asClass(RoleRepository).singleton(),
  inventoryRepository: asClass(InventoryRepository).singleton(),

  // Shared services (no request context needed)
  emailService: asClass(EmailService).singleton(),
  logger: asFunction(() => fastify.log).singleton(),
})
```

### 5.3 Request Scope Setup (Recommended)

```typescript
// hooks/request-scoped.ts
import { asClass, asValue, Lifetime } from 'awilix'

export function setupRequestScope(
  fastify: FastifyInstance
) {
  fastify.addHook('onRequest', (request, reply, done) => {
    // Register current user
    request.diScope.register({
      currentUser: asValue(request.authUser),
    })

    // Register request-scoped scope checker (cached per request)
    request.diScope.register({
      userScopes: asFunction(
        async ({ currentUser, roleRepository }) => {
          // This query runs once per request and is cached
          return roleRepository.getScopeNamesForUser(currentUser.id)
        }
      ).scoped(),

      scopeChecker: asClass(ScopeChecker).scoped(),
    })

    // Register business-context services
    request.diScope.register({
      inventoryService: asClass(InventoryService).scoped(),
      userService: asClass(UserService).scoped(),
    })

    done()
  })
}
```

### 5.4 Authorization Middleware (Recommended)

```typescript
// middleware/authorization.ts
import { ScopeNames } from '@/modules/user/user.scope.types'

export function createScopeGuard(...requiredScopes: ScopeNames[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')

    try {
      if (requiredScopes.length === 1) {
        await scopeChecker.requireScope(requiredScopes[0])
      } else {
        await scopeChecker.requireAllScopes(...requiredScopes)
      }
    } catch (error) {
      // Error handling with proper status codes
      return reply
        .code(error.statusCode || 403)
        .send({ message: error.message })
    }
  }
}

// Usage in routes
const readGuard = createScopeGuard(ScopeNames.INVENTORY_READ)
const writeGuard = createScopeGuard(ScopeNames.INVENTORY_WRITE)
const adminGuard = createScopeGuard(
  ScopeNames.USER_WRITE,
  ScopeNames.USER_DELETE
)

server.get('/items', { preHandler: readGuard }, handler)
server.post('/items', { preHandler: writeGuard }, handler)
server.delete('/items/:id', { preHandler: writeGuard }, handler)
```

### 5.5 Enhanced ScopeChecker for DI

```typescript
// services/scope-checker.ts (Enhanced)
export class ScopeChecker {
  // Constructor receives injected dependencies
  constructor(
    private currentUser: IAuthUser,
    private userScopes: Set<ScopeNames>, // Pre-cached from DI
  ) {}

  async hasScope(scope: ScopeNames): Promise<boolean> {
    // Already cached from DI, no more DB queries!
    return this.userScopes.has(scope)
  }

  async hasAllScopes(...scopes: ScopeNames[]): Promise<boolean> {
    return scopes.every((scope) => this.userScopes.has(scope))
  }

  async hasAnyScope(...scopes: ScopeNames[]): Promise<boolean> {
    return scopes.some((scope) => this.userScopes.has(scope))
  }

  async requireScope(scope: ScopeNames): Promise<IAuthUser> {
    if (!this.userScopes.has(scope)) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Required scope: ${scope}`,
      }
    }
    return this.currentUser
  }

  async requireAllScopes(...scopes: ScopeNames[]): Promise<IAuthUser> {
    if (!this.hasAllScopes(...scopes)) {
      throw {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Required scopes: ${scopes.join(', ')}`,
      }
    }
    return this.currentUser
  }
}
```

### 5.6 Integration in app.ts

```typescript
// app.ts (partial)
import { fastifyAwilixPlugin } from '@fastify/awilix'
import { diContainer } from './plugins/di/container'
import { setupRequestScope } from './hooks/request-scoped'

export default async function serviceApp(fastify, opts) {
  // Register DI plugin
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
    disposeOnClose: true,
    disposeOnResponse: true,
  })

  // Setup request scopes
  setupRequestScope(fastify)

  // Continue with existing setup...
  fastify.setValidatorCompiler(validatorCompiler)
  // ... etc
}
```

---

## 6. Comparison: Current vs. DI-Based Approach

### Current Implementation
```typescript
// Current in example.ts
const scopeChecker = new ScopeChecker(request, fastify)
const canRead = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ)
```

**Pros:**
- Simple, explicit
- Easy to understand

**Cons:**
- No dependency injection benefits
- Database query on every check (no caching)
- Manual instantiation per route
- Hard to mock in tests
- Repeated code across routes

### DI-Based Approach
```typescript
// DI-based in middleware
server.get(
  '/items',
  { preHandler: createScopeGuard(ScopeNames.INVENTORY_READ) },
  async (request, reply) => {
    // Scope already checked, continue
    const items = await request.diScope.resolve('inventoryService').getItems()
    return reply.send(items)
  }
)
```

**Pros:**
- ✅ Scopes cached per request (single DB query)
- ✅ Reusable middleware/decorators
- ✅ Type-safe with TypeScript
- ✅ Testable (mock dependencies easily)
- ✅ Follows FastAPI pattern (dependency injection)
- ✅ Scales to complex authorization logic
- ✅ Separates concerns

**Cons:**
- Requires setup/boilerplate
- Learning curve for awilix
- Slightly more complex

---

## 7. Migration Path (Recommended)

### Phase 1: Install & Setup (Low Risk)
```bash
npm install @fastify/awilix awilix
```

1. Create `plugins/di/` directory
2. Setup container registration
3. Register existing repositories/services

### Phase 2: Add Request Scopes
1. Setup onRequest hook
2. Register request-scoped services
3. Keep existing `ScopeChecker` usage

### Phase 3: Gradual Migration
1. Create scope middleware
2. Update routes one-by-one to use middleware
3. Update `ScopeChecker` to use cached scopes

### Phase 4: Full Adoption
1. Move all authorization checks to middleware
2. Establish patterns for route files
3. Documentation

---

## 8. Conclusion & Recommendation

### Summary

| Criterion | Rating | Notes |
|-----------|--------|-------|
| **Feasibility** | ✅ Excellent | Production-ready with awilix + @fastify/awilix |
| **FastAPI Similarity** | ✅ High | Very similar: Depends(get_current_user) ≈ DI container |
| **Performance** | ✅ Good | ~0.1-0.5ms/request, with query caching optimization |
| **Developer Experience** | ✅ Good | Requires TypeScript interfaces but very clean API |
| **Testing** | ✅ Excellent | DI makes mocking trivial |
| **Learning Curve** | ⚠️ Moderate | Awilix has great docs, takes ~1-2 days to master |

### Recommendation

**Implement fastify-awilix for scope-based authorization** because:

1. **Eliminates per-request database queries** - Cache scopes once per request scope
2. **Mirrors FastAPI patterns** - More familiar to Python developers on team
3. **Type-safe** - Full TypeScript support
4. **Testable** - Easy to mock dependencies
5. **Scalable** - Supports complex authorization logic
6. **Low risk** - Can be adopted gradually alongside existing code

### Suggested Implementation Priority

1. **Quick Win**: Implement scope caching (biggest benefit)
2. **Medium**: Add middleware/decorator patterns
3. **Long-term**: Full DI adoption across services

### Code Quality Improvements

Your current `ScopeChecker` is well-designed. The DI approach would enhance it by:
- Eliminating redundant scope queries through caching
- Providing type safety
- Making tests easier
- Following industry patterns

---

## References

- [Awilix GitHub](https://github.com/jeffijoe/awilix)
- [@fastify/awilix GitHub](https://github.com/fastify/fastify-awilix)
- [Awilix NPM Package](https://www.npmjs.com/package/awilix)
- [@fastify/awilix NPM Package](https://www.npmjs.com/package/@fastify/awilix)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-09
