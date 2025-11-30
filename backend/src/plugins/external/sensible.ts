import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import fastifySensible from "@fastify/sensible";

export default fp(async function sensiblePlugin(fastify: FastifyInstance) {
    await fastify.register(fastifySensible);
});
