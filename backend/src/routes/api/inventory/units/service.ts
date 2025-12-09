import type { FastifyInstance } from "fastify";
import type { ProductUnit } from "../../../../modules/inventory/product-unit/product-unit.entity";

export interface CreateProductUnitInput {
  name: string;
  symbol?: string;
}

export interface UpdateProductUnitInput {
  name?: string;
  symbol?: string;
}

export async function getAllUnits(
  fastify: FastifyInstance,
  businessId: string,
): Promise<ProductUnit[]> {
  const units = await fastify.db.productUnit.findAllByBusinessId(businessId);
  return units;
}

export async function createUnit(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateProductUnitInput,
): Promise<ProductUnit> {
  const { name, symbol } = input;

  const unit = await fastify.db.productUnit.create({
    name,
    symbol,
    businessId,
  });

  return unit;
}

export async function updateUnit(
  fastify: FastifyInstance,
  businessId: string,
  unitId: string,
  input: UpdateProductUnitInput,
): Promise<ProductUnit> {
  const unit = await fastify.db.productUnit.update(unitId, businessId, input);
  return unit;
}

export async function deleteUnit(
  fastify: FastifyInstance,
  businessId: string,
  unitId: string,
): Promise<void> {
  await fastify.db.productUnit.bulkDelete([unitId], businessId);
}

export async function bulkDeleteUnits(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.productUnit.bulkDelete(ids, businessId);
}
