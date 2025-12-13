import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { webhookService } from "@/modules/payment/webhook";

export default async function paymentsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Custom content type parser to get raw body for Stripe signature verification
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer", bodyLimit: 1048576 },
    (req, body, done) => {
      (req as FastifyRequest & { rawBody: Buffer }).rawBody = body as Buffer;
      try {
        const json = JSON.parse(body.toString());
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  /**
   * Stripe webhook endpoint
   * Handles payment events from Stripe and routes them to appropriate handlers
   */
  server.post(
    "/webhook",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        return reply.code(httpStatus.BAD_REQUEST).send({
          error: "Missing Stripe signature header",
        });
      }

      if (!webhookService.isConfigured()) {
        fastify.log.warn(
          "Stripe webhook received but webhook secret not configured",
        );
        return reply.code(httpStatus.OK).send({ received: true });
      }

      const rawBody = (request as FastifyRequest & { rawBody?: Buffer })
        .rawBody;
      if (!rawBody) {
        return reply.code(httpStatus.BAD_REQUEST).send({
          error: "Missing raw body for webhook verification",
        });
      }

      try {
        const event = webhookService.constructEvent(rawBody, signature);

        switch (event.type) {
          case "payment_intent.succeeded":
            await webhookService.handlePaymentSucceeded(
              fastify,
              event.data.object,
            );
            break;

          case "payment_intent.payment_failed":
            await webhookService.handlePaymentFailed(
              fastify,
              event.data.object,
            );
            break;

          default:
            fastify.log.debug(
              { type: event.type },
              "Unhandled webhook event type",
            );
        }

        return reply.code(httpStatus.OK).send({ received: true });
      } catch (error) {
        fastify.log.error({ error }, "Webhook processing failed");
        return reply.code(httpStatus.BAD_REQUEST).send({
          error: "Webhook processing failed",
        });
      }
    },
  );
}
