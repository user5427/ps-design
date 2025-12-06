import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { getBusinessId } from "../../../../shared/auth-utils";
import { handleServiceError } from "../../../../shared/error-handler";
import {
  ChangeIdParam,
  type ChangeIdParams,
  type CreateStockChangeBody,
  CreateStockChangeSchema,
  ProductIdParam,
  type ProductIdParams,
  type StockQuery,
  StockQuerySchema,
} from "./request-types";

export default async function stockRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const products = await fastify.db.product.findAllByBusinessId(businessId);

    const stockLevels = products.map((product) => ({
      productId: product.id,
      productName: product.name,
      productUnit: product.productUnit,
      isDisabled: product.isDisabled,
      totalQuantity: product.stockLevel?.quantity ?? 0,
    }));

    return reply.send(stockLevels);
  });

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
        const product = await fastify.db.product.getById(productId, businessId);
        const stockLevel =
          await fastify.db.stockLevel.findByProductId(productId);

        return reply.send({
          productId: product.id,
          productName: product.name,
          productUnit: product.productUnit,
          isDisabled: product.isDisabled,
          totalQuantity: stockLevel?.quantity ?? 0,
        });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post(
    "/changes",
    {
      schema: {
        body: CreateStockChangeSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateStockChangeBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId, quantity, type, expirationDate } = request.body;
      const user = request.authUser!;

      try {
        const stockChange = await fastify.db.stockChange.create({
          productId,
          quantity,
          type,
          expirationDate,
          businessId,
          createdByUserId: user.id,
        });

        return reply.code(httpStatus.CREATED).send(stockChange);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get(
    "/changes",
    {
      schema: {
        querystring: StockQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: StockQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.query;

      const changes = await fastify.db.stockChange.findAllByBusinessId(
        businessId,
        productId,
      );

      return reply.send(changes);
    },
  );

  server.delete(
    "/changes/:changeId",
    {
      schema: {
        params: ChangeIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ChangeIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { changeId } = request.params;

      try {
        await fastify.db.stockChange.delete(changeId, businessId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
