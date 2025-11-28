import { FastifyInstance } from "fastify";

export default async function homeRoute(fastify: FastifyInstance) {
    fastify.get("/", async (request, reply) => {    
        return { message: "Welcome to the Home!" };
    });
}