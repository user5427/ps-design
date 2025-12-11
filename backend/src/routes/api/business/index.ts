import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createBusiness,
  deleteBusiness,
  getBusinessById,
  getBusinessesPaginated,
  updateBusiness,
} from "./service";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  type BusinessIdParams,
  BusinessIdParam,
  type CreateBusinessBody,
  CreateBusinessSchema,
  type UpdateBusinessBody,
  UpdateBusinessSchema,
  type BusinessQuery,
  BusinessQuerySchema,
} from "@ps-design/schemas/business";
import {
  BusinessResponseSchema,
  PaginatedBusinessResponseSchema,
} from "@ps-design/schemas/business";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/shared/response-types";
import { AuditActionType, auditLogWrapper } from "@/modules/audit";

export default async function businessRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Making helper to create audit wrappers easier
  const createAuditWrapper = async (
    fn: (...args: any[]) => any,
    auditType: AuditActionType,
    request: FastifyRequest<{ Params: BusinessIdParams }>,
  ) => {
    let userContext = request.user as {
      userId: string;
      businessId: string | null;
    } | null;
    if (!userContext) {
      const user = await fastify.db.user.findByEmail(
        (request.body as any).email,
      );
      userContext = user ? { userId: user.id, businessId: null } : null;
    }

    if (!userContext?.userId) {
      userContext = {
        userId: "unknown",
        businessId: null,
      };
    }

    userContext.businessId =
      userContext.businessId || request.params.businessId || null;
    return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
      userId: userContext.userId,
      ip: request.ip,
      businessId: userContext.businessId || undefined,
      entityType: "Business",
      entityId: userContext.businessId || "",
    });
  };

  server.get<{ Querystring: BusinessQuery }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.BUSINESS_READ)],
      schema: {
        querystring: BusinessQuerySchema,
        response: {
          200: PaginatedBusinessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: BusinessQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { page = 1, limit = 20, search } = request.query;
        const result = await getBusinessesPaginated(
          fastify,
          page,
          limit,
          search,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: CreateBusinessBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.BUSINESS_CREATE),
      ],
      schema: {
        body: CreateBusinessSchema,
        response: {
          201: BusinessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateBusinessBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const createBusinessWrapped = await createAuditWrapper(
          createBusiness,
          AuditActionType.CREATE,
          request as any,
        );

        const business = await createBusinessWrapped(fastify, request.body);
        return reply.code(httpStatus.CREATED).send(business);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: BusinessIdParams }>(
    "/:businessId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.BUSINESS_READ)],
      schema: {
        params: BusinessIdParam,
        response: {
          200: BusinessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: BusinessIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { businessId } = request.params;
        const business = await getBusinessById(fastify, businessId);
        return reply.send(business);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: BusinessIdParams; Body: UpdateBusinessBody }>(
    "/:businessId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.BUSINESS_WRITE),
      ],
      schema: {
        params: BusinessIdParam,
        body: UpdateBusinessSchema,
        response: {
          200: BusinessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: BusinessIdParams;
        Body: UpdateBusinessBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { businessId } = request.params;
        const updateBusinessWrapped = await createAuditWrapper(
          updateBusiness,
          AuditActionType.UPDATE,
          request as any,
        );

        const updated = await updateBusinessWrapped(
          fastify,
          businessId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete<{ Params: BusinessIdParams }>(
    "/:businessId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.BUSINESS_DELETE),
      ],
      schema: {
        params: BusinessIdParam,
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: BusinessIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { businessId } = request.params;
        const deleteBusinessWrapped = await createAuditWrapper(
          deleteBusiness,
          AuditActionType.DELETE,
          request as any,
        );

        await deleteBusinessWrapped(fastify, businessId);
        return reply.send({ success: true });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
