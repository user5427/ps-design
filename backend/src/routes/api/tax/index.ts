import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";

import {
  getAllTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
} from "./service";

import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

import {
  CreateTaxSchema,
  UpdateTaxSchema,
  TaxIdParam,
  type CreateTaxBody,
  type UpdateTaxBody,
  type TaxIdParams,
} from "@ps-design/schemas/tax";

export default async function taxesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.TAX_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const taxes = await getAllTaxes(fastify, businessId);
      return reply.send(taxes);
    },
  );

  server.get<{ Params: TaxIdParams }>(
    "/:taxId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.TAX_READ)],
      schema: {
        params: TaxIdParam,
      },
    },
    async (
      request: FastifyRequest<{ Params: TaxIdParams }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { taxId } = request.params as TaxIdParams;

      try {
        const tax = await getTaxById(fastify, businessId, taxId);
        return reply.send(tax);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: CreateTaxBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.TAX_WRITE)],
      schema: {
        body: CreateTaxSchema,
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateTaxBody }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const wrapCreateTax = await fastify.audit.generic(
          createTax,
          AuditActionType.CREATE,
          request,
          reply,
          "Tax",
        );

        const tax = await wrapCreateTax(fastify, businessId, request.body);

        return reply.code(httpStatus.CREATED).send(tax);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: TaxIdParams; Body: UpdateTaxBody }>(
    "/:taxId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.TAX_WRITE)],
      schema: {
        params: TaxIdParam,
        body: UpdateTaxSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: TaxIdParams;
        Body: UpdateTaxBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { taxId } = request.params as TaxIdParams;

      try {
        const wrapUpdateTax = await fastify.audit.generic(
          updateTax,
          AuditActionType.UPDATE,
          request,
          reply,
          "Tax",
          taxId,
        );

        const updated = await wrapUpdateTax(
          fastify,
          businessId,
          taxId,
          request.body,
        );

        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete<{ Params: TaxIdParams }>(
    "/:taxId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.TAX_DELETE)],
      schema: {
        params: TaxIdParam,
      },
    },
    async (
      request: FastifyRequest<{ Params: TaxIdParams }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;
      const { taxId } = request.params as TaxIdParams;
      try {
        const wrapDeleteTax = await fastify.audit.generic(
          deleteTax,
          AuditActionType.DELETE,
          request,
          reply,
          "Tax",
          taxId,
        );
        await wrapDeleteTax(fastify, businessId, taxId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
