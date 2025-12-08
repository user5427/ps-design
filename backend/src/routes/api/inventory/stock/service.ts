import type { FastifyInstance } from "fastify";
import type { Product } from "@/modules/inventory/product";
import {
  type CreateStockChangeBody,
  type UpdateStockChangeBody,
  type StockLevelResponse,
  type StockChangeResponse,
  StockChangeResponseSchema,
} from "@ps-design/schemas/inventory/stock";

export async function getAllStockLevels(
  fastify: FastifyInstance,
  businessId: string,
): Promise<StockLevelResponse[]> {
  const products = await fastify.db.product.findAllByBusinessId(businessId);

  const stockLevels = products.map((product: Product) => ({
    productId: product.id,
    productName: product.name,
    productUnit: product.productUnit,
    isDisabled: product.isDisabled,
    totalQuantity: product.stockLevel?.quantity ?? 0,
  }));

  return stockLevels;
}

export async function getStockLevelByProductId(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<StockLevelResponse> {
  const product = await fastify.db.product.getById(productId, businessId);
  const stockLevel = await fastify.db.stockLevel.findByProductId(productId);

  return {
    productId: product.id,
    productName: product.name,
    productUnit: product.productUnit,
    isDisabled: product.isDisabled,
    totalQuantity: stockLevel?.quantity ?? 0,
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

  return StockChangeResponseSchema.parse(stockChange);
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

  return StockChangeResponseSchema.parse(stockChange);
}

export async function getStockChanges(
  fastify: FastifyInstance,
  businessId: string,
  productId?: string,
): Promise<StockChangeResponse[]> {
  const changes = await fastify.db.stockChange.findAllByBusinessId(
    businessId,
    productId,
  );

  return changes.map((change) => StockChangeResponseSchema.parse(change));
}

export async function deleteStockChange(
  fastify: FastifyInstance,
  businessId: string,
  changeId: string,
): Promise<void> {
  await fastify.db.stockChange.delete(changeId, businessId);
}

export async function bulkDeleteStockChanges(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.stockChange.bulkDelete(ids, businessId);
}
