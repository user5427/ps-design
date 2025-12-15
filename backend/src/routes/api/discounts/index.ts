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
  CreateServiceDiscountSchema,
  CreateMenuDiscountSchema,
  type CreateServiceDiscountBody,
  type CreateMenuDiscountBody,
  DiscountIdParam,
  type DiscountIdParams,
  UpdateServiceDiscountSchema,
  UpdateMenuDiscountSchema,
  type UpdateServiceDiscountBody,
  type UpdateMenuDiscountBody,
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
  const { requireScope, requireAnyScope } = createScopeMiddleware(fastify);

  server.get(
    "/services",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.SERVICE_DISCOUNTS),
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

  server.post<{ Body: CreateServiceDiscountBody }>(
    "/services",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.SERVICE_DISCOUNTS),
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

  server.get(
    "/menu",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.MENU_DISCOUNTS),
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

  server.post<{ Body: CreateMenuDiscountBody }>(
    "/menu",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.MENU_DISCOUNTS),
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
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(discount);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: DiscountIdParams; Body: UpdateServiceDiscountBody }>(
    "/services/:discountId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.SERVICE_DISCOUNTS),
      ],
      schema: {
        params: DiscountIdParam,
        body: UpdateServiceDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: DiscountIdParams;
        Body: UpdateServiceDiscountBody;
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

  server.put<{ Params: DiscountIdParams; Body: UpdateMenuDiscountBody }>(
    "/menu/:discountId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.MENU_DISCOUNTS),
      ],
      schema: {
        params: DiscountIdParam,
        body: UpdateMenuDiscountSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: DiscountIdParams;
        Body: UpdateMenuDiscountBody;
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

  server.get<{ Params: DiscountIdParams }>(
    "/:discountId",
    {
      onRequest: [
        fastify.authenticate,
        requireAnyScope(
          ScopeNames.SERVICE_DISCOUNTS,
          ScopeNames.MENU_DISCOUNTS,
        ),
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

  server.delete<{ Params: DiscountIdParams }>(
    "/services/:discountId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.SERVICE_DISCOUNTS),
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

  server.delete<{ Params: DiscountIdParams }>(
    "/menu/:discountId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.MENU_DISCOUNTS),
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
