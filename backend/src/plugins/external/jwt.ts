import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user:
      | { userId: string; role: string; businessId: string | null }
      | { userId: string; jti: string };
  }
}

export default fp(async function jwtPlugin(fastify: FastifyInstance) {
  // Register cookie plugin first
  await fastify.register(fastifyCookie);

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
  });
});
