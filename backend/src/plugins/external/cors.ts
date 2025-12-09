import fastifyCors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });
}

export default fp(corsPlugin, {
  name: "cors",
});
