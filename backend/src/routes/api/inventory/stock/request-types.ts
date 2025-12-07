import { z } from "zod";
import { StockChangeType } from '@/modules/inventory/stock-change/stock-change.types';
import { PaginationSchema } from '@/shared/request-types';
import { datetime, uuid } from '@/shared/zod-utils';

const StockChangeTypeEnum = z.enum(StockChangeType);

export const ChangeIdParam = z.object({ changeId: uuid() });
export const ProductIdParam = z.object({ productId: uuid() });

export const CreateStockChangeSchema = z.object({
  productId: uuid("Invalid product ID"),
  quantity: z.number(),
  type: StockChangeTypeEnum,
  expirationDate: datetime().optional(),
});

export const StockQuerySchema = PaginationSchema.extend({
  productId: uuid().optional(),
  type: StockChangeTypeEnum.optional(),
});

export type CreateStockChangeBody = z.infer<typeof CreateStockChangeSchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;
export type ChangeIdParams = z.infer<typeof ChangeIdParam>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
