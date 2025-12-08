import type { FastifyInstance } from "fastify";
import type { Product } from "@/modules/inventory/product";
import { CreateStockChangeBody, StockLevelResponse, StockChangeResponse, StockChangeResponseSchema } from "@ps-design/schemas/inventory/stock";

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
    type: type as any, // type is already validated by Zod schema
    expirationDate,
    businessId,
    createdByUserId: userId,
  });

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
