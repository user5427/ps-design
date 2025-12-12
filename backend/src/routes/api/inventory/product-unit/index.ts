import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteUnits,
  createUnit,
  getAllUnitsPaginated,
  updateUnit,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  CreateProductUnitSchema,
  UnitIdParam,
  UpdateProductUnitSchema,
  type UnitIdParams,
  type UpdateProductUnitBody,
  type CreateProductUnitBody,
  PaginatedProductUnitResponseSchema,
} from "@ps-design/schemas/inventory/product-unit";
import {
  UniversalPaginationQuerySchema,
  type UniversalPaginationQuery,
} from "@ps-design/schemas/pagination";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";

export default async function unitsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope, requireAllScopes } = createScopeMiddleware(fastify);

  server.get<{ Querystring: UniversalPaginationQuery }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        querystring: UniversalPaginationQuerySchema,
        response: {
          200: PaginatedProductUnitResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: UniversalPaginationQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const units = await getAllUnitsPaginated(
          fastify,
          businessId,
          request.query,
        );
        return reply.send(units);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: CreateProductUnitBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        body: CreateProductUnitSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateProductUnitBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const unit = await createUnit(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send(unit);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: UnitIdParams; Body: UpdateProductUnitBody }>(
    "/:unitId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        params: UnitIdParam,
        body: UpdateProductUnitSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: UnitIdParams;
        Body: UpdateProductUnitBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { unitId } = request.params;

      try {
        const unit = await updateUnit(
          fastify,
          businessId,
          unitId,
          request.body,
        );
        return reply.send(unit);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: BulkDeleteBody }>(
    "/bulk-delete",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_DELETE),
      ],
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
        await bulkDeleteUnits(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
