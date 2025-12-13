import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteUnits,
  createUnit,
  getAllUnits,
  updateUnit,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  type CreateProductUnitBody,
  CreateProductUnitSchema,
  UnitIdParam,
  type UnitIdParams,
  type UpdateProductUnitBody,
  UpdateProductUnitSchema,
} from "@ps-design/schemas/inventory/units";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { AuditActionType } from "@/modules/audit/audit-log.types";

export default async function unitsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope, requireAllScopes } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const units = await getAllUnits(fastify, businessId);
      return reply.send(units);
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
        const wrapCreateUnit = await fastify.audit.generic(
          createUnit,
          AuditActionType.CREATE,
          request,
          reply,
          "ProductUnit",
        );

        const unit = await wrapCreateUnit(fastify, businessId, request.body);
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
        const wrapUpdateUnit = await fastify.audit.generic(
          updateUnit,
          AuditActionType.UPDATE,
          request,
          reply,
          "ProductUnit",
          unitId,
        );

        const unit = await wrapUpdateUnit(
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
        const wrapBulkDeleteUnits = await fastify.audit.generic(
          bulkDeleteUnits,
          AuditActionType.DELETE,
          request,
          reply,
          "ProductUnit",
          request.body.ids,
        );

        await wrapBulkDeleteUnits(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
