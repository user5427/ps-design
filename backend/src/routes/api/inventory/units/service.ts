import type { FastifyInstance } from "fastify";
import type { ProductUnit } from "../../../../modules/inventory/product-unit/product-unit.entity";
import type {
  ProductUnitResponse,
  PaginatedProductUnitResponse,
  CreateProductUnitBody,
  UpdateProductUnitBody,
  UnitQuery,
} from "@ps-design/schemas/inventory/units";
import { ProductUnitResponseSchema } from "@ps-design/schemas/inventory/units";

function toProductUnitResponse(unit: ProductUnit): ProductUnitResponse {
  return {
    id: unit.id,
    name: unit.name,
    symbol: unit.symbol,
    businessId: unit.businessId,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
    deletedAt: unit.deletedAt?.toISOString() ?? null,
  };
}

export async function getAllUnitsPaginated(
  fastify: FastifyInstance,
  businessId: string,
  query: UnitQuery,
): Promise<PaginatedProductUnitResponse> {
  const result = await fastify.db.productUnit.findAllPaginated(
    businessId,
    query,
  );
  return {
    items: result.items.map((item) => ProductUnitResponseSchema.parse(toProductUnitResponse(item))),
    metadata: result.metadata,
  };
}

export async function createUnit(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateProductUnitBody,
): Promise<ProductUnitResponse> {
  const { name, symbol } = input;

  const unit = await fastify.db.productUnit.create({
    name,
    symbol,
    businessId,
  });

  return toProductUnitResponse(unit);
}

export async function updateUnit(
  fastify: FastifyInstance,
  businessId: string,
  unitId: string,
  input: UpdateProductUnitBody,
): Promise<ProductUnitResponse> {
  const unit = await fastify.db.productUnit.update(unitId, businessId, input);
  return toProductUnitResponse(unit);
}

export async function bulkDeleteUnits(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.productUnit.bulkDelete(ids, businessId);
}
