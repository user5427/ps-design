import type { FastifyInstance } from "fastify";
import type { Product } from "@/modules/inventory/product";
import type { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import type {
  CreateStockChangeBody,
  UpdateStockChangeBody,
  StockLevelResponse,
  StockChangeResponse,
} from "@ps-design/schemas/inventory/stock";

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

export async function getAllStockLevels(
  fastify: FastifyInstance,
  businessId: string,
): Promise<StockLevelResponse[]> {
  const products = await fastify.db.product.findAllByBusinessId(businessId);
  return products.map(toStockLevelResponse);
}

export async function getStockLevelByProductId(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<StockLevelResponse> {
  const product = await fastify.db.product.getById(productId, businessId);
  return toStockLevelResponse(product);
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

export async function getStockChanges(
  fastify: FastifyInstance,
  businessId: string,
  productId?: string,
): Promise<StockChangeResponse[]> {
  const changes = await fastify.db.stockChange.findAllByBusinessId(
    businessId,
    productId,
  );

  return changes.map(toStockChangeResponse);
}
