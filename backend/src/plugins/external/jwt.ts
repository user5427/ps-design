import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";

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
