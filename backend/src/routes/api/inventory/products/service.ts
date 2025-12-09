import type { FastifyInstance } from "fastify";
import type {
  CreateProductBody,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/products";
import type { Product } from "../../../../modules/inventory/product/product.entity";

export async function getAllProducts(
  fastify: FastifyInstance,
  businessId: string,
): Promise<Product[]> {
  const products = await fastify.db.product.findAllByBusinessId(businessId);
  return products;
}

export async function createProduct(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateProductBody,
): Promise<Product> {
  const { name, description, productUnitId } = input;

  const product = await fastify.db.product.create({
    name,
    description,
    productUnitId,
    businessId,
  });

  return product;
}

export async function getProductById(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<Product> {
  const product = await fastify.db.product.getById(productId, businessId);
  return product;
}

export async function updateProduct(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
  input: UpdateProductBody,
): Promise<Product> {
  const updated = await fastify.db.product.update(productId, businessId, input);
  return updated;
}

export async function bulkDeleteProducts(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.product.bulkDelete(ids, businessId);
}
