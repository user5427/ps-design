import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { stripeService } from "@/modules/payment/stripe-service";
import { payAppointment } from "@/routes/api/appointments/service";

export default async function paymentsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

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

  server.post(
    "/webhook",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        return reply.code(httpStatus.BAD_REQUEST).send({
          error: "Missing Stripe signature header",
        });
      }

      if (!stripeService.isWebhookConfigured()) {
        fastify.log.warn(
          "Stripe webhook received but webhook secret not configured",
        );
        return reply.code(httpStatus.OK).send({ received: true });
      }

      try {
        const rawBody = (request as FastifyRequest & { rawBody?: Buffer })
          .rawBody;
        if (!rawBody) {
          return reply.code(httpStatus.BAD_REQUEST).send({
            error: "Missing raw body for webhook verification",
          });
        }

        const event = stripeService.constructWebhookEvent(rawBody, signature);

        switch (event.type) {
          case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const { appointmentId, businessId, tipAmount, giftCardCode } =
              paymentIntent.metadata;

            if (appointmentId && businessId) {
              fastify.log.info(
                { appointmentId, paymentIntentId: paymentIntent.id },
                "Payment succeeded via webhook",
              );

              try {
                const existingPayment =
                  await fastify.db.appointmentPayment.findByAppointmentIdAndBusinessId(
                    appointmentId,
                    businessId,
                  );

                if (existingPayment) {
                  fastify.log.info(
                    { appointmentId, paymentIntentId: paymentIntent.id },
                    "Appointment already paid, skipping webhook fulfillment",
                  );
                } else {
                  const appointment = await fastify.db.appointment.getById(
                    appointmentId,
                    businessId,
                  );

                  await payAppointment(
                    fastify,
                    businessId,
                    appointmentId,
                    appointment.createdById,
                    {
                      paymentMethod: "STRIPE",
                      tipAmount: tipAmount
                        ? parseInt(tipAmount, 10)
                        : undefined,
                      giftCardCode: giftCardCode || undefined,
                      paymentIntentId: paymentIntent.id,
                    },
                  );

                  fastify.log.info(
                    { appointmentId, paymentIntentId: paymentIntent.id },
                    "Payment fulfilled via webhook",
                  );
                }
              } catch (error) {
                fastify.log.error(
                  { error, appointmentId, paymentIntentId: paymentIntent.id },
                  "Failed to fulfill payment via webhook",
                );
              }
            }
            break;
          }
          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            fastify.log.warn(
              { paymentIntentId: paymentIntent.id },
              "Payment failed via webhook",
            );
            break;
          }
          default:
            fastify.log.debug(
              { type: event.type },
              "Unhandled webhook event type",
            );
        }

        return reply.code(httpStatus.OK).send({ received: true });
      } catch (error) {
        fastify.log.error({ error }, "Webhook signature verification failed");
        return reply.code(httpStatus.BAD_REQUEST).send({
          error: "Webhook signature verification failed",
        });
      }
    },
  );
}
