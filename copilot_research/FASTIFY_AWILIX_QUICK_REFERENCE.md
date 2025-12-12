# Fastify-Awilix Quick Reference Guide

**TL;DR**: Use fastify-awilix for scoped dependency injection + authorization. Replaces manual ScopeChecker instantiation with reusable, testable, type-safe guards.

---

## 60-Second Overview

### Current Pattern (What We Have Now)
```typescript
server.get('/items', async (request, reply) => {
  const scopeChecker = new ScopeChecker(request, fastify) // Repeated in every route
  const canRead = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ) // DB query!
  if (!canRead) return reply.code(403).send()
  
  const items = await getItems() // Business logic
  return reply.send(items)
})
```

**Issues**:
- Repeated code in every route
- Database query for each check
- Hard to test
- Not type-safe

### DI Pattern (What We Should Have)
```typescript
const readGuard = createScopeGuard(ScopeNames.INVENTORY_READ)

server.get('/items', { preHandler: readGuard }, async (request, reply) => {
  // Scope already checked by middleware!
  // Scopes cached per request (no new queries)
  
  const items = await request.diScope.resolve('inventoryService').getItems()
  return reply.send(items)
})
```

**Benefits**:
- No duplication (reuse `readGuard`)
- Cached per request (1 query instead of N)
- Automatic type checking
- Easy to test

---

## Installation

```bash
npm install @fastify/awilix awilix
```

---

## 3-Step Setup

### Step 1: Create Container
```typescript
// plugins/di/container.ts
import { createContainer, asClass, Lifetime } from 'awilix'

export const diContainer = createContainer({ strict: true })

diContainer.register({
  userRepository: asClass(UserRepository).singleton(),
  roleRepository: asClass(RoleRepository).singleton(),
})
```

### Step 2: Register Plugin
```typescript
// app.ts
import { fastifyAwilixPlugin } from '@fastify/awilix'
import { diContainer } from './plugins/di/container'

await fastify.register(fastifyAwilixPlugin, {
  container: diContainer,
  disposeOnResponse: true,
})
```

### Step 3: Setup Request Scope
```typescript
// plugins/di/request-scope.ts
import { asFunction, asValue } from 'awilix'

fastify.addHook('onRequest', (request, reply, done) => {
  request.diScope.register({
    currentUser: asValue(request.authUser),
    
    userScopes: asFunction(async ({ currentUser, roleRepository }) => {
      // Runs once per request, then cached!
      const scopes = await roleRepository.getScopesForUser(currentUser.id)
      return new Set(scopes)
    }).scoped(),
    
    scopeChecker: asClass(ScopeChecker).scoped(),
  })
  done()
})
```

---

## Creating Guards

### Pattern 1: Single Scope
```typescript
const readGuard = createScopeGuard(ScopeNames.INVENTORY_READ)

server.get('/items', { preHandler: readGuard }, handler)
```

### Pattern 2: Multiple Scopes (All Required)
```typescript
const adminGuard = createScopeGuard(
  ScopeNames.USER_WRITE,
  ScopeNames.USER_DELETE
)

server.delete('/users/:id', { preHandler: adminGuard }, handler)
```

### Pattern 3: Multiple Scopes (Any of)
```typescript
const anyGuard = createAnyScopeGuard(
  ScopeNames.INVENTORY_READ,
  ScopeNames.INVENTORY_WRITE
)

server.get('/inventory', { preHandler: anyGuard }, handler)
```

---

## Using in Handlers

### Option 1: Guards Do All Checking
```typescript
// Guard already verified scope before handler runs
server.get(
  '/items',
  { preHandler: createScopeGuard(ScopeNames.INVENTORY_READ) },
  async (request, reply) => {
    const service = request.diScope.resolve('inventoryService')
    const items = await service.getItems()
    return reply.send(items)
  }
)
```

### Option 2: Manual Check in Handler
```typescript
server.get('/items', async (request, reply) => {
  const scopeChecker = request.diScope.resolve('scopeChecker')
  
  // Throws 403 if missing
  scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
  
  const items = await request.diScope.resolve('inventoryService').getItems()
  return reply.send(items)
})
```

### Option 3: Service-Level Checks
```typescript
class InventoryService {
  constructor(
    private scopeChecker: ScopeChecker,
    private repo: InventoryRepository
  ) {}

  async getItems() {
    // Check inside service - nice for business logic
    this.scopeChecker.requireScope(ScopeNames.INVENTORY_READ)
    return this.repo.getAll()
  }
}
```

---

## ScopeChecker API

```typescript
// Check without throwing
const has = scopeChecker.hasScope(ScopeNames.READ)
const hasAll = scopeChecker.hasAllScopes(READ, WRITE)
const hasAny = scopeChecker.hasAnyScope(READ, WRITE, ADMIN)

// Check with throwing
const user = scopeChecker.requireScope(ScopeNames.READ) // 403 if missing
const user = scopeChecker.requireAllScopes(READ, WRITE) // 403 if any missing

// Get info
const allScopes = scopeChecker.getAllScopes()
const user = scopeChecker.getCurrentUser()
```

---

## TypeScript Types

```typescript
// Declare cradle types once
declare module '@fastify/awilix' {
  interface Cradle {
    userRepository: UserRepository
    inventoryRepository: InventoryRepository
  }
  
  interface RequestCradle extends Cradle {
    currentUser: IAuthUser
    userScopes: Set<ScopeNames>
    scopeChecker: ScopeChecker
  }
}

// Now fully typed everywhere
request.diScope.resolve('scopeChecker') // ✅ Typed
request.diScope.cradle.currentUser // ✅ Typed
fastify.diContainer.cradle.userRepository // ✅ Typed
```

---

## Testing

```typescript
import { createContainer, asValue } from 'awilix'

// Create test scope
const container = createContainer()
const scope = container.createScope()

scope.register({
  currentUser: asValue(mockUser),
  scopeChecker: asValue(mockScopeChecker),
  userScopes: asValue(new Set([ScopeNames.READ])),
})

// Resolve service with mocked dependencies
const service = scope.resolve('myService')

// Service runs with mocked user context
```

---

## Common Patterns

### Pattern: Scope-Based Business Logic
```typescript
class UserService {
  constructor(private scopeChecker: ScopeChecker, private repo: UserRepository) {}

  async listUsers() {
    // Verify scope
    const user = this.scopeChecker.requireScope(ScopeNames.USER_READ)
    
    // Business logic
    return this.repo.findByBusinessId(user.businessId)
  }
}
```

### Pattern: Multiple Scope Combinations
```typescript
// Admin needs both write AND delete
const adminGuard = createScopeGuard(
  ScopeNames.USER_WRITE,
  ScopeNames.USER_DELETE
)

// Regular users need either read OR write
const userGuard = createAnyScopeGuard(
  ScopeNames.DATA_READ,
  ScopeNames.DATA_WRITE
)
```

### Pattern: Conditional Authorization
```typescript
server.put(
  '/items/:id',
  async (request, reply) => {
    const scopeChecker = request.diScope.resolve('scopeChecker')
    const user = request.user

    // Different checks based on context
    if (user.isAdmin) {
      // Admins can always edit
      return updateItem()
    } else {
      // Regular users need write scope
      scopeChecker.requireScope(ScopeNames.INVENTORY_WRITE)
      return updateItem()
    }
  }
)
```

---

## Migrating from Current Approach

### Current Code
```typescript
const scopeChecker = new ScopeChecker(request, fastify)
const canRead = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ)
if (!canRead) {
  return reply.code(403).send()
}
```

### DI Version - Step 1: Use Guard
```typescript
server.get(
  '/items',
  { preHandler: createScopeGuard(ScopeNames.INVENTORY_READ) },
  async (request, reply) => {
    // Scope already checked! Just get data.
  }
)
```

### DI Version - Step 2: Use Service
```typescript
server.get('/items', { preHandler: readGuard }, async (request, reply) => {
  const service = request.diScope.resolve('inventoryService')
  const items = await service.getItems() // Service does scope check internally
  return reply.send(items)
})
```

---

## Performance Comparison

### Queries per request

**Current approach** (N+1 problem):
```
Route 1: getItems() - 1 query to check scope + 1 query to get data = 2 queries
Route 2: createItem() - 1 query to check scope + 1 query to create = 2 queries
Total: 4 database queries
```

**DI approach** (with caching):
```
Setup: 1 query to fetch user scopes (cached)
Route 1: getItems() - 0 new queries + 1 query to get data = 1 query
Route 2: createItem() - 0 new queries + 1 query to create = 1 query
Total: 2 database queries (50% reduction!)
```

---

## Troubleshooting

### "Cannot resolve 'X'"
You forgot to register it. Add to container or request scope:
```typescript
diContainer.register({
  myService: asClass(MyService),
})
```

### TypeScript says service is undefined
Declare it in Cradle/RequestCradle:
```typescript
declare module '@fastify/awilix' {
  interface RequestCradle {
    myService: MyService
  }
}
```

### Scope check not working in handler
Make sure hook ran. Check that authUser is set:
```typescript
const user = request.authUser // Should be defined
const scopes = request.diScope.resolve('userScopes') // Should exist
```

### Service tests fail
Create test scope and register mocks:
```typescript
const scope = diContainer.createScope()
scope.register({
  scopeChecker: asValue(mockChecker),
})
const service = scope.resolve('myService')
```

---

## Checklist: Am I using DI correctly?

- [ ] Guard is in `preHandler` (not in handler)
- [ ] `createScopeGuard()` is called once, reused multiple times
- [ ] Services are registered with `.scoped()` lifetime
- [ ] Repositories are registered with `.singleton()`
- [ ] Current user comes from DI, not manual setup
- [ ] I'm resolving from `request.diScope`, not creating instances
- [ ] Types are declared in Cradle interface

---

## Resources

- **This Quick Ref**: Right here! 📄
- **Deep Analysis**: `FASTIFY_AWILIX_ANALYSIS.md`
- **Implementation Guide**: `FASTIFY_AWILIX_IMPLEMENTATION_GUIDE.md`
- **Decision Framework**: `FASTIFY_AWILIX_DECISION_FRAMEWORK.md`

---

## Bottom Line

✅ **Do this**:
```typescript
const readGuard = createScopeGuard(ScopeNames.READ)
server.get('/items', { preHandler: readGuard }, handler)
```

❌ **Don't do this**:
```typescript
const checker = new ScopeChecker(request, fastify)
const can = await checker.hasScope(ScopeNames.READ)
if (!can) return reply.code(403).send()
// ... repeated in every route
```

---

**Questions? Check the Analysis or Implementation Guide. Ready to start? Follow Phase 1 in the Implementation Guide.**
