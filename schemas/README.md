# @ps-design/schemas

Shared Zod validation schemas for PS Design application. This package contains all request and response schemas used across the backend and frontend applications, ensuring consistency and type safety throughout the application.

## Features

- ✅ Isolated schema definitions independent of backend/frontend implementations
- ✅ Type-safe validation with Zod
- ✅ Organized folder structure mirroring API routes
- ✅ Docker support for monorepo development
- ✅ NPM workspace integration

## Project Structure

```
schemas/
├── src/
│   ├── shared/
│   │   ├── zod-utils.ts          # Common Zod utility functions
│   │   ├── request-types.ts      # Common request schemas (Pagination, etc.)
│   │   ├── response-types.ts     # Common response schemas (Success, Error)
│   │   └── index.ts
│   ├── auth/
│   │   ├── request-types.ts      # Login, ChangePassword schemas
│   │   ├── response-types.ts     # Auth user, Login response schemas
│   │   └── index.ts
│   ├── inventory/
│   │   ├── products/
│   │   │   ├── request-types.ts  # CreateProduct, UpdateProduct schemas
│   │   │   ├── response-types.ts # Product response schema
│   │   │   └── index.ts
│   │   ├── stock/
│   │   │   ├── types.ts          # StockChangeType enum
│   │   │   ├── request-types.ts  # CreateStockChange, StockQuery schemas
│   │   │   ├── response-types.ts # StockLevel, StockChange response schemas
│   │   │   └── index.ts
│   │   ├── units/
│   │   │   ├── request-types.ts  # CreateProductUnit, UpdateProductUnit schemas
│   │   │   ├── response-types.ts # ProductUnit response schema
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts                  # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### In Backend

```typescript
// Import from @ps-design/schemas
import {
  LoginSchema,
  type LoginBody,
} from "@ps-design/schemas/auth";

import {
  CreateProductSchema,
  ProductResponseSchema,
} from "@ps-design/schemas/inventory/products";
```

### In Frontend

```typescript
// Import from @ps-design/schemas
import {
  LoginRequestSchema,
  type LoginRequest,
  LoginResponseSchema,
} from "@ps-design/schemas/auth";

import { CreateProductSchema } from "@ps-design/schemas/inventory/products";
```

## Installation

The schemas package is included in the monorepo and installed automatically when running `npm ci` from the root directory.

```bash
# From root directory
npm ci

# Or install just this package's dependencies
cd schemas
npm install
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run dev
```

## Docker Support

The Docker setup includes the schemas package in the volume mounts for both backend and frontend:

```yaml
volumes:
  - ./schemas/src:/app/schemas/src
```

Both backend and frontend Dockerfiles copy the schemas package:

```dockerfile
COPY schemas/package.json schemas/tsconfig.json ./schemas/
COPY schemas/src ./schemas/src
```

## Important Rules

1. **NO CHANGES IN SOURCE SCHEMAS** - The backend is the source of truth for schema definitions. All schema changes must be made in the backend first, then migrated here.

2. **ISOLATION** - Schemas are non-dependent on backend or frontend implementations. Only import Zod and shared utilities.

3. **FOLDER STRUCTURE** - The folder structure mirrors the backend API routes for easy navigation and maintenance.

4. **EXPORTS** - Each folder has an `index.ts` that re-exports all schemas for convenient imports.

## Dependency Notes

- **zod**: ^4.1.12 - Schema validation library

### No Backend/Frontend Dependencies

This package does NOT depend on:
- TypeORM
- Fastify
- React
- Any backend-specific utilities

This ensures true isolation and allows it to be used independently if needed.

## Development

When adding new schemas:

1. Add the new schemas to the appropriate folder in `schemas/src`
2. Update the folder's `index.ts` to re-export the new schemas
3. Update the root `src/index.ts` if adding a new top-level category
4. Update backend/frontend route files to use the schemas from the package

## Migration Notes

- **StockChangeType**: This enum is duplicated from `backend/src/modules/inventory/stock-change/stock-change.types.ts` to keep the schemas package self-contained.
- **Shared Utilities**: Only zod-utils, request-types, and response-types are in this package. Other shared utilities (auth-utils, error-handler, etc.) remain in the backend.

## Workspace Configuration

This package is configured as an NPM workspace in the root `package.json`:

```json
{
  "workspaces": [
    "backend",
    "frontend",
    "schemas"
  ]
}
```

This ensures that backend and frontend can use `@ps-design/schemas` as a local dependency with `workspace:*` protocol.
