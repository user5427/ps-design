import type { FastifyInstance } from "fastify";
import type {
  CreateProductBody,
  UpdateProductBody,
  ProductResponse,
  PaginatedProductResponse,
} from "@ps-design/schemas/inventory/product";
import { ProductResponseSchema } from "@ps-design/schemas/inventory/product";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import type { Product } from "../../../../modules/inventory/product/product.entity";

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    productUnitId: product.productUnitId,
    businessId: product.businessId,
    isDisabled: product.isDisabled,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    deletedAt: product.deletedAt?.toISOString() ?? null,
    productUnit: {
      id: product.productUnit.id,
      name: product.productUnit.name,
      symbol: product.productUnit.symbol,
    },
  };
}

export async function getAllProductsPaginated(
  fastify: FastifyInstance,
  businessId: string,
  query: UniversalPaginationQuery,
): Promise<PaginatedProductResponse> {
  const result = await fastify.db.product.findAllPaginated(
    businessId,
    query,
  );
  return {
    items: result.items.map((item: Product) => ProductResponseSchema.parse(toProductResponse(item))),
    metadata: result.metadata,
  };
}

export async function createProduct(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateProductBody,
): Promise<ProductResponse> {
  const { name, description, productUnitId } = input;

  const product = await fastify.db.product.create({
    name,
    description,
    productUnitId,
    businessId,
  });

  return toProductResponse(product);
}

export async function getProductById(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<ProductResponse> {
  const product = await fastify.db.product.getById(productId, businessId);
  return toProductResponse(product);
}

export async function updateProduct(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
  input: UpdateProductBody,
): Promise<ProductResponse> {
  const updated = await fastify.db.product.update(productId, businessId, input);
  return toProductResponse(updated);
}

export async function bulkDeleteProducts(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.product.bulkDelete(ids, businessId);
}
