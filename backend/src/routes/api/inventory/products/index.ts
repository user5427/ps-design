import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { getBusinessId } from "../../../../shared/auth-utils";
import { handleServiceError } from "../../../../shared/error-handler";
import {
  type CreateProductBody,
  createProductSchema,
  type ProductIdParams,
  productIdParam,
  type UpdateProductBody,
  updateProductSchema,
} from "./request-types";

export default async function productsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const products = await fastify.db.product.findAllByBusinessId(businessId);

    return reply.send(products);
  });

  server.post(
    "/",
    {
      schema: {
        body: createProductSchema,
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

      const { name, description, productUnitId } = request.body;

      try {
        const product = await fastify.db.product.create({
          name,
          description,
          productUnitId,
          businessId,
        });

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
        params: productIdParam,
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
        const product = await fastify.db.product.getById(productId, businessId);
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
        params: productIdParam,
        body: updateProductSchema,
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
        const updated = await fastify.db.product.update(
          productId,
          businessId,
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
        params: productIdParam,
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
        await fastify.db.product.delete(productId, businessId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
