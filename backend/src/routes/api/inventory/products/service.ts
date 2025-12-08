import type { FastifyInstance } from "fastify";
import type { ProductResponse } from "@ps-design/schemas/inventory/products";
import type {
  CreateProductBody,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/products";

export async function getAllProducts(
  fastify: FastifyInstance,
  businessId: string,
): Promise<ProductResponse[]> {
  const products = await fastify.db.product.findAllByBusinessId(businessId);
  return products;
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

  return product;
}

export async function getProductById(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<ProductResponse> {
  const product = await fastify.db.product.getById(productId, businessId);
  return product;
}

export async function updateProduct(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
  input: UpdateProductBody,
): Promise<ProductResponse> {
  const updated = await fastify.db.product.update(productId, businessId, input);
  return updated;
}

export async function deleteProduct(
  fastify: FastifyInstance,
  businessId: string,
  productId: string,
): Promise<void> {
  await fastify.db.product.delete(productId, businessId);
}
