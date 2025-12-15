import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  type CreateOrderBody,
  CreateOrderSchema,
  OrderIdParam,
  type OrderIdParams,
  type PayOrderBody,
  PayOrderSchema,
  type RefundOrderBody,
  RefundOrderSchema,
  type UpdateOrderItemsBody,
  UpdateOrderItemsSchema,
  type UpdateOrderTotalsBody,
  UpdateOrderTotalsSchema,
} from "@ps-design/schemas/order/order";
import { getBusinessId, getUserId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  cancelOrder,
  createOrder,
  getOrder,
  initiateOrderStripePayment,
  payOrder,
  refundOrder,
  sendOrderItems,
  updateOrderItems,
  updateOrderTotals,
} from "./service";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function ordersRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.post<{ Body: CreateOrderBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        body: CreateOrderSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateOrderBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const order = await createOrder(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: OrderIdParams }>(
    "/:orderId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const order = await getOrder(fastify, businessId, request.params);
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: OrderIdParams; Body: UpdateOrderItemsBody }>(
    "/:orderId/items",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
        body: UpdateOrderItemsSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
        Body: UpdateOrderItemsBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const order = await updateOrderItems(
          fastify,
          businessId,
          orderId,
          request.body,
        );
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Params: OrderIdParams }>(
    "/:orderId/send",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const userId = getUserId(request, reply);
      if (!userId) return;

      const { orderId } = request.params;

      try {
        const order = await sendOrderItems(
          fastify,
          businessId,
          orderId,
          userId,
        );
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.patch<{ Params: OrderIdParams; Body: UpdateOrderTotalsBody }>(
    "/:orderId/totals",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
        body: UpdateOrderTotalsSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
        Body: UpdateOrderTotalsBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const order = await updateOrderTotals(
          fastify,
          businessId,
          orderId,
          request.body,
        );
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Params: OrderIdParams; Body: PayOrderBody }>(
    "/:orderId/pay",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
        body: PayOrderSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
        Body: PayOrderBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const order = await payOrder(
          fastify,
          businessId,
          orderId,
          request.body,
        );
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Params: OrderIdParams }>(
    "/:orderId/pay/initiate",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const result = await initiateOrderStripePayment(
          fastify,
          businessId,
          orderId,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Params: OrderIdParams; Body: RefundOrderBody }>(
    "/:orderId/refund",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
        body: RefundOrderSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
        Body: RefundOrderBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const order = await refundOrder(
          fastify,
          businessId,
          orderId,
          request.body,
        );
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Params: OrderIdParams }>(
    "/:orderId/cancel",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.ORDERS),
      ],
      schema: {
        params: OrderIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: OrderIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { orderId } = request.params;

      try {
        const order = await cancelOrder(fastify, businessId, orderId);
        return reply.send(order);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
