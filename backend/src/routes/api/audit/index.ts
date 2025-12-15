import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

import {
  AuditBusinessLogQuerySchema,
  AuditSecurityLogQuerySchema,
  PaginatedAuditBusinessLogResponseSchema,
  PaginatedAuditSecurityLogResponseSchema,
  type AuditBusinessLogQuery,
  type AuditSecurityLogQuery,
  AuditBusinessLogIdParam,
  AuditSecurityLogIdParam,
} from "@ps-design/schemas/audit";

import {
  getAuditBusinessLogs,
  getAuditBusinessLogById,
  getAuditSecurityLogs,
  getAuditSecurityLogById,
} from "./service";

import { ErrorResponseSchema } from "@ps-design/schemas/shared/response-types";

export default async function auditRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Querystring: AuditBusinessLogQuery }>(
    "/business",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.AUDIT_BUSINESS),
      ],
      schema: {
        querystring: AuditBusinessLogQuerySchema,
        response: {
          200: PaginatedAuditBusinessLogResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: AuditBusinessLogQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const logs = await getAuditBusinessLogs(fastify, request.query);
        return reply.send(logs);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: { id: string } }>(
    "/business/:id",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.AUDIT_BUSINESS),
      ],
      schema: {
        params: AuditBusinessLogIdParam,
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const log = await getAuditBusinessLogById(fastify, request.params.id);
        return reply.send(log);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Querystring: AuditSecurityLogQuery }>(
    "/security",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.AUDIT_SECURITY),
      ],
      schema: {
        querystring: AuditSecurityLogQuerySchema,
        response: {
          200: PaginatedAuditSecurityLogResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: AuditSecurityLogQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const logs = await getAuditSecurityLogs(fastify, request.query);
        return reply.send(logs);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: { id: string } }>(
    "/security/:id",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.AUDIT_SECURITY),
      ],
      schema: {
        params: AuditSecurityLogIdParam,
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const log = await getAuditSecurityLogById(fastify, request.params.id);
        return reply.send(log);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
