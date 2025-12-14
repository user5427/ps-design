import fp from "fastify-plugin";
import { auditLogWrapper, type EntityName } from "@/modules/audit";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { BusinessIdParams } from "@ps-design/schemas/business";
import { AuditActionType, AuditSecurityType, type AuditType } from "@/modules/audit";
import { getBusinessId } from "@/shared/auth-utils";

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("audit", {
    business: async (
      fn: (...args: any[]) => Promise<any>,
      auditType: AuditActionType,
      request:
        | FastifyRequest
        | FastifyRequest<{ Params: { businessId: string } }>,
    ) => {
      const userContext = request.user as {
        userId: string;
        businessId: string | undefined;
      };

      const baseParams = {
        userId: userContext.userId,
        ip: request.ip,
        entityType: "Business" as EntityName,
      };

      if (auditType === AuditActionType.CREATE) {
        return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
          ...baseParams,
          businessId: undefined,
          entityId: undefined, // can be left undefined, handled by wrapper
        });
      }

      const params = request.params as Partial<BusinessIdParams>;
      if ("businessId" in params) {
        userContext.businessId = params.businessId;
      }

      // Support single or multiple entity IDs
      const entityIds = Array.isArray(userContext.businessId)
        ? userContext.businessId
        : userContext.businessId
          ? [userContext.businessId]
          : undefined;

      const businessIdValue = userContext.businessId;
      if (!businessIdValue) {
        throw new Error("Business ID not found");
      }

      return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
        ...baseParams,
        businessId: businessIdValue,
        entityId: entityIds,
      });
    },

    security: async (
      fn: (...args: any[]) => Promise<any>,
      auditType: AuditSecurityType,
      request: FastifyRequest,
    ) => {
      let userId = request.user?.userId || null;

      if (!userId) {
        const body = request.body as { email?: string } | undefined;
        const email = body?.email;
        const user = email
          ? await fastify.db.user.findByEmail(email)
          : null;
        userId = user ? user.id : null;
      }

      if (!userId) {
        userId = "unknown";
      }

      return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
        userId,
        ip: request.ip,
      });
    },

    generic: async (
      fn: (...args: any[]) => Promise<any>,
      auditType: AuditType,
      request: FastifyRequest,
      reply: FastifyReply,
      entityType: string,
      entityId?: string | string[] | null, // support single or multiple IDs
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) throw new Error("Business ID not found");

      const baseParams: {
        userId: string;
        ip: string;
        entityType: EntityName;
      } = {
        userId: (request.user as { userId: string }).userId,
        ip: request.ip,
        entityType: entityType as EntityName,
      };

      return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
        ...baseParams,
        businessId,
        entityId, // can be single or array
      });
    },
  });
});
