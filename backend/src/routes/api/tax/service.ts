import type { FastifyInstance } from "fastify";
import type {
  CreateTaxBody,
  UpdateTaxBody,
  TaxResponse,
} from "@ps-design/schemas/tax";
import type { Tax } from "@/modules/tax/tax.entity";

function toTaxResponse(tax: Tax): TaxResponse {
  return {
    id: tax.id,
    name: tax.name,
    description: tax.description,
    rate: tax.rate,
    businessId: tax.businessId,
    createdAt: tax.createdAt.toISOString(),
    updatedAt: tax.updatedAt.toISOString(),
    deletedAt: tax.deletedAt?.toISOString() ?? null,
  };
}

export async function getAllTaxes(
  fastify: FastifyInstance,
  businessId: string,
): Promise<TaxResponse[]> {
  const taxes = await fastify.db.tax.findAllByBusinessId(businessId);
  return taxes.map(toTaxResponse);
}

export async function getTaxById(
  fastify: FastifyInstance,
  businessId: string,
  taxId: string,
): Promise<TaxResponse> {
  const tax = await fastify.db.tax.getById(taxId, businessId);
  if (!tax) {
    throw new Error("Tax not found");
  }
  return toTaxResponse(tax);
}

export async function createTax(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateTaxBody,
): Promise<TaxResponse> {
  const tax = await fastify.db.tax.create({
    ...input,
    businessId,
  });

  return toTaxResponse(tax);
}

export async function updateTax(
  fastify: FastifyInstance,
  businessId: string,
  taxId: string,
  input: UpdateTaxBody,
): Promise<TaxResponse> {
  const tax = await fastify.db.tax.update(
    taxId,
    businessId,
    input,
  );
  if (!tax) {
    throw new Error("Tax not found");
  }

  return toTaxResponse(tax);
}

export async function deleteTax(
  fastify: FastifyInstance,
  businessId: string,
  taxId: string,
): Promise<void> {
  await fastify.db.tax.softDelete(taxId, businessId);
}
