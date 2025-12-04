import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Business Management API",
        description: "API documentation",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: "/api-docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}

export default fp(swaggerPlugin, {
  name: "swagger",
});
