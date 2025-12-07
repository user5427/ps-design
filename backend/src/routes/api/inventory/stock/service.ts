import type { FastifyInstance } from "fastify";
import type { Product } from "@/modules/inventory/product";

export interface CreateStockChangeInput {
  productId: string;
  quantity: number;
  type: string;
  expirationDate?: string;
}

export interface StockLevelOutput {
  productId: string;
  productName: string;
  productUnit: any;
  isDisabled: boolean;
  totalQuantity: number;
}

export async function getAllStockLevels(
  fastify: FastifyInstance,
  businessId: string,
): Promise<StockLevelOutput[]> {
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
): Promise<StockLevelOutput> {
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
  input: CreateStockChangeInput,
): Promise<any> {
  const { productId, quantity, type, expirationDate } = input;

  const stockChange = await fastify.db.stockChange.create({
    productId,
    quantity,
    type,
    expirationDate,
    businessId,
    createdByUserId: userId,
  });

  return stockChange;
}

export async function getStockChanges(
  fastify: FastifyInstance,
  businessId: string,
  productId?: string,
): Promise<any[]> {
  const changes = await fastify.db.stockChange.findAllByBusinessId(
    businessId,
    productId,
  );

  return changes;
}

export async function deleteStockChange(
  fastify: FastifyInstance,
  businessId: string,
  changeId: string,
): Promise<void> {
  await fastify.db.stockChange.delete(changeId, businessId);
}
