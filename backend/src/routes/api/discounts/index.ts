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
  CreateServiceDiscountSchema,
  CreateMenuDiscountSchema,
  type CreateServiceDiscountBody,
  type CreateMenuDiscountBody,
  DiscountIdParam,
  type DiscountIdParams,
  type UpdateDiscountBody,
  UpdateDiscountSchema,
  GetApplicableOrderDiscountSchema,
  type GetApplicableOrderDiscountQuery,
  GetApplicableServiceDiscountSchema,
  type GetApplicableServiceDiscountQuery,
  GetApplicableOrderDiscountSchema as GetApplicableOrderDiscountS,
  GetApplicableServiceDiscountSchema as GetApplicableServiceDiscountS,
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const discounts = await getAllDiscounts(fastify, businessId);
      return reply.send(discounts);
    },
  );

  // Get service discounts
  server.get(
    "/services",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const discounts = await getAllDiscounts(fastify, businessId, [
        "SERVICE",
        "ORDER",
      ]);
      return reply.send(discounts);
    },
  );

  // Create service discount
  server.post<{ Body: CreateServiceDiscountBody }>(
    "/services",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_WRITE),
      ],
      schema: {
        body: CreateServiceDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateServiceDiscountBody;
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

        // Cast to any because CreateServiceDiscountBody is a subset of CreateDiscountBody logic-wise
        const discount = await createDiscountWrapped(
          fastify,
          businessId,
          request.body as any,
        );
        return reply.code(httpStatus.CREATED).send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get menu discounts
  server.get(
    "/menu",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const discounts = await getAllDiscounts(fastify, businessId, [
        "MENU_ITEM",
        "ORDER",
      ]);
      return reply.send(discounts);
    },
  );

  // Create menu discount
  server.post<{ Body: CreateMenuDiscountBody }>(
    "/menu",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_WRITE),
      ],
      schema: {
        body: CreateMenuDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateMenuDiscountBody;
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
          request.body as any,
        );
        return reply.code(httpStatus.CREATED).send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Create discount (Generic - keeping for compatibility/admin if needed, or deprecate?)
  // User asked to "create api endpoint specific...", didn't explicitly say delete the old one, but said "do not forget to delete unused schemas/types".
  // I will keep the generic one for now but the UI will switch to specific ones.
  server.post<{ Body: CreateDiscountBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_WRITE),
      ],
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_READ),
      ],
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_WRITE),
      ],
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.DISCOUNTS_DELETE),
      ],
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
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
