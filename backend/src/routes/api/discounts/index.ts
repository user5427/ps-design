import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createDiscount,
  deleteDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  getApplicableDiscountForOrder,
  getApplicableDiscountForService,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateDiscountBody,
  CreateDiscountSchema,
  DiscountIdParam,
  type DiscountIdParams,
  type UpdateDiscountBody,
  UpdateDiscountSchema,
  GetApplicableOrderDiscountSchema,
  type GetApplicableOrderDiscountQuery,
  GetApplicableServiceDiscountSchema,
  type GetApplicableServiceDiscountQuery,
} from "@ps-design/schemas/discount";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

export default async function discountsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get all discounts
  server.get(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.DISCOUNTS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const discounts = await getAllDiscounts(fastify, businessId);
      return reply.send(discounts);
    },
  );

  // Create discount
  server.post<{ Body: CreateDiscountBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.DISCOUNTS)],
      schema: {
        body: CreateDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateDiscountBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const createDiscountWrapped = await fastify.audit.generic(
          createDiscount,
          AuditActionType.CREATE,
          request,
          reply,
          "Discount",
        );

        const discount = await createDiscountWrapped(
          fastify,
          businessId,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get discount by ID
  server.get<{ Params: DiscountIdParams }>(
    "/:discountId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.DISCOUNTS)],
      schema: {
        params: DiscountIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: DiscountIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { discountId } = request.params;

      try {
        const discount = await getDiscountById(fastify, businessId, discountId);
        return reply.send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Update discount
  server.put<{ Params: DiscountIdParams; Body: UpdateDiscountBody }>(
    "/:discountId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.DISCOUNTS)],
      schema: {
        params: DiscountIdParam,
        body: UpdateDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: DiscountIdParams;
        Body: UpdateDiscountBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { discountId } = request.params;

      try {
        const updateDiscountWrapped = await fastify.audit.generic(
          updateDiscount,
          AuditActionType.UPDATE,
          request,
          reply,
          "Discount",
          discountId,
        );

        const updated = await updateDiscountWrapped(
          fastify,
          businessId,
          discountId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Delete discount
  server.delete<{ Params: DiscountIdParams }>(
    "/:discountId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.DISCOUNTS)],
      schema: {
        params: DiscountIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: DiscountIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { discountId } = request.params;

      try {
        const deleteDiscountWrapped = await fastify.audit.generic(
          deleteDiscount,
          AuditActionType.DELETE,
          request,
          reply,
          "Discount",
          discountId,
        );

        await deleteDiscountWrapped(fastify, businessId, discountId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get applicable discount for order (for checkout flow)
  server.get<{ Querystring: GetApplicableOrderDiscountQuery }>(
    "/applicable/order",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU)],
      schema: {
        querystring: GetApplicableOrderDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetApplicableOrderDiscountQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const { menuItemIds, orderTotal } = request.query;
        const discount = await getApplicableDiscountForOrder(
          fastify,
          businessId,
          menuItemIds,
          orderTotal,
        );
        return reply.send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get applicable discount for service (for appointment checkout flow)
  server.get<{ Querystring: GetApplicableServiceDiscountQuery }>(
    "/applicable/service",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS)],
      schema: {
        querystring: GetApplicableServiceDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetApplicableServiceDiscountQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const { serviceDefinitionId, servicePrice } = request.query;
        const discount = await getApplicableDiscountForService(
          fastify,
          businessId,
          serviceDefinitionId,
          servicePrice,
        );
        return reply.send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
