import fp from "fastify-plugin";
import { auditLogWrapper } from "@/modules/audit";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { BusinessIdParams } from "@ps-design/schemas/business";
import { AuditActionType } from "@/modules/audit";
import { getBusinessId } from "@/shared/auth-utils";

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("audit", {
    business: async (
      fn: (...args: any[]) => any,
      auditType: any,
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
        entityType: "Business",
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

      return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
        ...baseParams,
        businessId: userContext.businessId!,
        entityId: entityIds,
      });
    },

    security: async (
      fn: (...args: any[]) => any,
      auditType: any,
      request: FastifyRequest,
    ) => {
      let userId = request.user?.userId || null;

      if (!userId) {
        const user = await fastify.db.user.findByEmail(
          (request.body as any).email,
        );
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
      fn: (...args: any[]) => any,
      auditType: any,
      request: FastifyRequest,
      reply: FastifyReply,
      entityType: string,
      entityId?: string | string[] | null, // support single or multiple IDs
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) throw new Error("Business ID not found");

      const baseParams = {
        userId: (request.user as { userId: string }).userId,
        ip: request.ip,
        entityType,
      };

      return auditLogWrapper(fn, fastify.db.auditLogService, auditType, {
        ...baseParams,
        businessId,
        entityId, // can be single or array
      });
    },
  });
});
