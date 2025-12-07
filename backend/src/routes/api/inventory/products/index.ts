import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateProductBody,
  CreateProductSchema,
  ProductIdParam,
  type ProductIdParams,
  type UpdateProductBody,
  UpdateProductSchema,
} from "@ps-design/schemas/inventory/products";

export default async function productsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const products = await getAllProducts(fastify, businessId);
    return reply.send(products);
  });

  server.post(
    "/",
    {
      schema: {
        body: CreateProductSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateProductBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const product = await createProduct(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send(product);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get(
    "/:productId",
    {
      schema: {
        params: ProductIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        const product = await getProductById(fastify, businessId, productId);
        return reply.send(product);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put(
    "/:productId",
    {
      schema: {
        params: ProductIdParam,
        body: UpdateProductSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
        Body: UpdateProductBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        const updated = await updateProduct(
          fastify,
          businessId,
          productId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete(
    "/:productId",
    {
      schema: {
        params: ProductIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        await deleteProduct(fastify, businessId, productId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
