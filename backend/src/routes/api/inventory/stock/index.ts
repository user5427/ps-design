import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteStockChanges,
  createStockChange,
  deleteStockChange,
  getAllStockLevels,
  getStockChanges,
  getStockLevelByProductId,
  updateStockChange,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  ChangeIdParam,
  type ChangeIdParams,
  type CreateStockChangeBody,
  CreateStockChangeSchema,
  ProductIdParam,
  type ProductIdParams,
  type StockQuery,
  StockQuerySchema,
  type UpdateStockChangeBody,
  UpdateStockChangeSchema,
} from "@ps-design/schemas/inventory/stock";
import { BulkDeleteSchema, type BulkDeleteBody } from "@ps-design/schemas/shared";

export default async function stockRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const stockLevels = await getAllStockLevels(fastify, businessId);
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
        const stockLevel = await getStockLevelByProductId(
          fastify,
          businessId,
          productId,
        );
        return reply.send(stockLevel);
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

      const user = request.authUser!;

      try {
        const stockChange = await createStockChange(
          fastify,
          businessId,
          user.id,
          request.body,
        );
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

      const changes = await getStockChanges(fastify, businessId, productId);
      return reply.send(changes);
    },
  );

  server.put(
    "/changes/:changeId",
    {
      schema: {
        params: ChangeIdParam,
        body: UpdateStockChangeSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ChangeIdParams;
        Body: UpdateStockChangeBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { changeId } = request.params;

      try {
        const stockChange = await updateStockChange(
          fastify,
          businessId,
          changeId,
          request.body,
        );
        return reply.send(stockChange);
      } catch (error) {
        return handleServiceError(error, reply);
      }
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
        await deleteStockChange(fastify, businessId, changeId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post(
    "/changes/bulk-delete",
    {
      schema: {
        body: BulkDeleteSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: BulkDeleteBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        await bulkDeleteStockChanges(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
