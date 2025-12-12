import type { FastifyInstance } from "fastify";
import type { Product } from "@/modules/inventory/product";
import type {
  StockLevelResponse,
  PaginatedStockLevelResponse,
} from "@ps-design/schemas/inventory/stock-level";
import {
  StockLevelResponseSchema,
} from "@ps-design/schemas/inventory/stock-level";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

function toStockLevelResponse(product: Product): StockLevelResponse {
  return {
    productId: product.id,
    productName: product.name,
    productUnit: {
      id: product.productUnit.id,
      name: product.productUnit.name,
      symbol: product.productUnit.symbol,
    },
    isDisabled: product.isDisabled,
    totalQuantity: product.stockLevel?.quantity ?? 0,
  };
}

export async function getAllStockLevelsPaginated(
  fastify: FastifyInstance,
  businessId: string,
  query: UniversalPaginationQuery,
): Promise<PaginatedStockLevelResponse> {
  const result = await fastify.db.product.findAllPaginated(
    businessId,
    query,
  );
  return {
    items: result.items.map((item: Product) => StockLevelResponseSchema.parse(toStockLevelResponse(item))),
    metadata: result.metadata,
  };
}

export async function getStockLevelByProductId(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<StockLevelResponse> {
  const product = await fastify.db.product.getById(productId, businessId);
  return toStockLevelResponse(product);
}
