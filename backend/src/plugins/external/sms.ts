import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createSMSService, type SMSService } from "@/modules/notification";

declare module "fastify" {
  interface FastifyInstance {
    smsService: SMSService;
  }
}

export default fp(async function smsPlugin(fastify: FastifyInstance) {
  const smsService = createSMSService(fastify);

  fastify.decorate("smsService", smsService);

  fastify.log.info(
    `📱 SMS Service initialized (enabled: ${process.env.ENABLE_SMS_NOTIFICATIONS === "true"})`,
  );
});
