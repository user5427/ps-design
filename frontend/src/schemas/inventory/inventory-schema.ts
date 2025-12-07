import { z } from "zod";

// --- Product Unit Schemas ---
export const ProductUnitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  symbol: z.string().max(10).optional().nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const CreateProductUnitSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10).optional(),
});

export const UpdateProductUnitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(10).optional(),
});

// --- Product Schemas ---
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  productUnitId: z.string().uuid(),
  productUnit: ProductUnitSchema.optional(),
  isDisabled: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  productUnitId: z.string().uuid(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  productUnitId: z.string().uuid().optional(),
  isDisabled: z.boolean().optional(),
});

// --- Stock Level Schemas ---
export const StockLevelSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  product: ProductSchema.optional(),
  quantity: z.number(),
  updatedAt: z.string().datetime().optional(),
});

// --- Stock Change Schemas ---
export const StockChangeTypeEnum = z.enum([
  "SUPPLY",
  "USAGE",
  "ADJUSTMENT",
  "WASTE",
]);

export const StockChangeSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  product: ProductSchema.optional(),
  quantity: z.number(),
  type: StockChangeTypeEnum,
  expirationDate: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime().optional(),
});

export const CreateStockChangeSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number(),
  type: StockChangeTypeEnum,
  expirationDate: z.string().datetime().optional(),
});

// Types
export type ProductUnit = z.infer<typeof ProductUnitSchema>;
export type CreateProductUnit = z.infer<typeof CreateProductUnitSchema>;
export type UpdateProductUnit = z.infer<typeof UpdateProductUnitSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export type StockLevel = z.infer<typeof StockLevelSchema>;

export type StockChangeType = z.infer<typeof StockChangeTypeEnum>;
export type StockChange = z.infer<typeof StockChangeSchema>;
export type CreateStockChange = z.infer<typeof CreateStockChangeSchema>;
