import fastifyCors from "@fastify/cors";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

async function corsPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: true,
        credentials: true,
    });
}

export default fp(corsPlugin, {
    name: "cors",
});
