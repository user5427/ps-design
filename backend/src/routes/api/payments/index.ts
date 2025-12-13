import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { stripeService } from "@/modules/payment/stripe-service";
import { handleServiceError } from "@/shared/error-handler";
import {
  CreatePaymentIntentSchema,
  type CreatePaymentIntentBody,
} from "@ps-design/schemas/payments";

export default async function paymentsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Create a payment intent for Stripe payments
  server.post<{ Body: CreatePaymentIntentBody }>(
    "/create-intent",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CreatePaymentIntentSchema,
      },
    },
    async (
      request: FastifyRequest<{ Body: CreatePaymentIntentBody }>,
      reply: FastifyReply,
    ) => {
      try {
        if (!stripeService.isConfigured()) {
          return reply.code(httpStatus.SERVICE_UNAVAILABLE).send({
            error: "Stripe is not configured",
          });
        }

        const result = await stripeService.createPaymentIntent({
          amount: request.body.amount,
          currency: request.body.currency,
        });

        return reply.send({
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
        });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Check if Stripe is configured
  server.get(
    "/config",
    {
      onRequest: [fastify.authenticate],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        stripeEnabled: stripeService.isConfigured(),
      });
    },
  );
}
