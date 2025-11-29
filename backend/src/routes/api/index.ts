import { FastifyInstance } from "fastify";

export default async function indexRoute(fastify: FastifyInstance) {
    fastify.get("/", async (request, reply) => {
        return { message: "Welcome to the index!" };
    });
}