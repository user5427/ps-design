import fastifySensible from "@fastify/sensible";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async function sensiblePlugin(fastify: FastifyInstance) {
	await fastify.register(fastifySensible);
});
