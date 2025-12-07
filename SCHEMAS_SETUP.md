# Schemas Package - Quick Setup Guide

## ✅ What's Done

A new `@ps-design/schemas` package has been successfully created and integrated into your monorepo. All Zod schemas have been migrated from backend and frontend into a centralized, isolated package.

## 📦 Package Contents

### Shared Utilities (`schemas/src/shared/`)
- `zod-utils.ts` - UUID and datetime utilities
- `request-types.ts` - Pagination schema
- `response-types.ts` - Success/Error response schemas

### Auth Schemas (`schemas/src/auth/`)
- `request-types.ts` - LoginSchema, ChangePasswordSchema
- `response-types.ts` - AuthUserResponseSchema, LoginResponseSchema, RefreshResponseSchema

### Inventory Schemas (`schemas/src/inventory/`)

#### Products (`inventory/products/`)
- `request-types.ts` - CreateProductSchema, UpdateProductSchema
- `response-types.ts` - ProductResponseSchema

#### Stock (`inventory/stock/`)
- `types.ts` - StockChangeType enum
- `request-types.ts` - CreateStockChangeSchema, StockQuerySchema
- `response-types.ts` - StockLevelResponseSchema, StockChangeResponseSchema

#### Units (`inventory/units/`)
- `request-types.ts` - CreateProductUnitSchema, UpdateProductUnitSchema
- `response-types.ts` - ProductUnitResponseSchema

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm ci

# Or from root, this will install schemas, backend, and frontend
```

### 2. Development Mode

```bash
# Run both backend and frontend
npm run dev

# Or run individually
npm run dev:backend
npm run dev:frontend
```

### 3. Docker Development

```bash
# Start all services with Docker
docker-compose up

# Rebuild on dependency changes
docker-compose up --build
```

## 📍 Project Structure

```
ps-design/
├── package.json                 (Root workspace config - NEW)
├── docker-compose.yml           (Updated)
├── backend/
│   ├── package.json            (Now includes @ps-design/schemas dependency)
│   ├── Dockerfile.dev          (Updated for monorepo)
│   └── src/routes/api/
│       ├── auth/
│       │   ├── request-types.ts    (Now re-exports from schemas)
│       │   └── response-types.ts   (Now re-exports from schemas)
│       └── inventory/
│           ├── products/
│           │   ├── request-types.ts
│           │   └── response-types.ts
│           ├── stock/
│           │   ├── request-types.ts
│           │   └── response-types.ts
│           └── units/
│               ├── request-types.ts
│               └── response-types.ts
├── frontend/
│   ├── package.json            (Now includes @ps-design/schemas dependency)
│   ├── Dockerfile.dev          (Updated for monorepo)
│   └── src/schemas/auth/
│       └── auth-schema.ts       (Now imports from @ps-design/schemas)
└── schemas/                     (NEW PACKAGE)
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src/
        ├── index.ts
        ├── shared/
        ├── auth/
        └── inventory/
```

## 🔑 Key Rules

### ✅ NO CHANGES IN SOURCE SCHEMAS
Backend schemas are the source of truth. All schemas remain EXACTLY the same - only moved to a shared location.

### ✅ COMPLETE ISOLATION
The `@ps-design/schemas` package has:
- ❌ NO dependencies on backend code
- ❌ NO dependencies on frontend code
- ✅ ONLY dependency: `zod`

### ✅ FOLDER STRUCTURE PRESERVED
- `auth/` → Backend auth routes
- `inventory/products/` → Inventory products routes
- `inventory/stock/` → Inventory stock routes
- `inventory/units/` → Inventory units routes

## 📚 Usage Examples

### In Backend

```typescript
// Before (still works)
import { LoginSchema } from './request-types';

// After (recommended)
import { LoginSchema, type LoginBody } from "@ps-design/schemas/auth";
```

### In Frontend

```typescript
// Before
import { LoginRequestSchema } from "@/schemas/auth/auth-schema";

// After (recommended)
import { LoginSchema as LoginRequestSchema } from "@ps-design/schemas/auth";
```

## 🛠️ Next Steps

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Start development:**
   ```bash
   npm run dev
   # or
   docker-compose up
   ```

3. **Optional - Gradual Migration:**
   - Frontend can continue using local schemas or migrate to `@ps-design/schemas`
   - Backend can update imports gradually or keep using the re-exports

4. **Optional - Add to Git:**
   ```bash
   git add schemas/
   git commit -m "feat: create isolated @ps-design/schemas package"
   ```

## ✨ Benefits

✅ **No Duplication** - Single source of truth for schemas
✅ **Type Safety** - Consistent validation across app
✅ **Easier Maintenance** - Update schemas in one place
✅ **Better Isolation** - Schemas have no backend/frontend dependencies
✅ **Docker Ready** - Full monorepo support with Docker Compose
✅ **Future Proof** - Can publish to NPM registry if needed
✅ **Backward Compatible** - Existing backend imports still work

## 🐛 Troubleshooting

### Module Resolution Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules schemas/node_modules
npm ci
```

### Docker Build Issues
```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### TypeScript Errors
```bash
# Rebuild TypeScript in each package
npm run build
```

## 📝 Files Created

- ✅ `schemas/package.json` - Workspace package config
- ✅ `schemas/tsconfig.json` - TypeScript config
- ✅ `schemas/README.md` - Detailed documentation
- ✅ `schemas/.gitignore` - Git ignore rules
- ✅ `schemas/src/index.ts` - Main entry point
- ✅ `schemas/src/shared/*` - Shared utilities
- ✅ `schemas/src/auth/*` - Auth schemas
- ✅ `schemas/src/inventory/*` - Inventory schemas

## 📝 Files Modified

- ✅ `package.json` - Added workspaces config
- ✅ `docker-compose.yml` - Updated build context and volumes
- ✅ `backend/package.json` - Added schemas dependency
- ✅ `backend/Dockerfile.dev` - Updated for monorepo
- ✅ `backend/src/routes/api/*/*.ts` - Updated to re-export from schemas
- ✅ `frontend/package.json` - Added schemas dependency
- ✅ `frontend/Dockerfile.dev` - Updated for monorepo
- ✅ `frontend/src/schemas/auth/*.ts` - Updated to import from schemas

## 💡 Notes

- Backend's `/src/shared/` folder (auth-utils, error-handler, etc.) remains unchanged
- Only route-specific schemas (request-types, response-types) were migrated
- All backend schema functionality is preserved through re-exports
- No breaking changes to existing code

---

**You're all set!** 🎉 Start using `npm ci` and `npm run dev` or `docker-compose up` to see it in action.
