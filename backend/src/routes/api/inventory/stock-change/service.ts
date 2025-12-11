import type { FastifyInstance } from "fastify";
import type { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import type {
  CreateStockChangeBody,
  UpdateStockChangeBody,
  StockChangeResponse,
  PaginatedStockChangeResponse,
} from "@ps-design/schemas/inventory/stock-change";
import {
  StockChangeResponseSchema,
} from "@ps-design/schemas/inventory/stock-change";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

function toStockChangeResponse(change: StockChange): StockChangeResponse {
  // expirationDate is a date-only field that may come as string "YYYY-MM-DD" or Date
  const formatExpirationDate = (date: Date | string | null): string | null => {
    if (!date) return null;
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  };

  return {
    id: change.id,
    productId: change.productId,
    businessId: change.businessId,
    quantity: change.quantity,
    type: change.type,
    expirationDate: formatExpirationDate(change.expirationDate),
    createdByUserId: change.createdByUserId,
    createdAt: change.createdAt.toISOString(),
    updatedAt: change.updatedAt.toISOString(),
    deletedAt: change.deletedAt?.toISOString() ?? null,
    product: {
      id: change.product.id,
      name: change.product.name,
      productUnitId: change.product.productUnitId,
      productUnit: {
        id: change.product.productUnit.id,
        name: change.product.productUnit.name,
        symbol: change.product.productUnit.symbol,
      },
    },
  };
}

export async function createStockChange(
  fastify: FastifyInstance,
  businessId: string,
  userId: string,
  input: CreateStockChangeBody,
): Promise<StockChangeResponse> {
  const { productId, quantity, type, expirationDate } = input;

  const stockChange = await fastify.db.stockChange.create({
    productId,
    quantity,
    type: type as any,
    expirationDate,
    businessId,
    createdByUserId: userId,
  });

  return toStockChangeResponse(stockChange);
}

export async function updateStockChange(
  fastify: FastifyInstance,
  businessId: string,
  changeId: string,
  input: UpdateStockChangeBody,
): Promise<StockChangeResponse> {
  const stockChange = await fastify.db.stockChange.update(
    changeId,
    businessId,
    {
      quantity: input.quantity,
      type: input.type as any,
      expirationDate: input.expirationDate,
    },
  );

  return toStockChangeResponse(stockChange);
}

export async function getStockChangesPaginated(
  fastify: FastifyInstance,
  businessId: string,
  query: UniversalPaginationQuery,
): Promise<PaginatedStockChangeResponse> {
  const result = await fastify.db.stockChange.findAllPaginated(
    businessId,
    query,
  );
  return {
    items: result.items.map((item: StockChange) => StockChangeResponseSchema.parse(toStockChangeResponse(item))),
    metadata: result.metadata,
  };
}
