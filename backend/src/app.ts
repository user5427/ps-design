import fastifyAutoLoad from "@fastify/autoload";
import type {
  FastifyError,
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import httpStatus from "http-status";
import path from "node:path";

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  // Set up Zod validation and serialization
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const autoLoad = (dir: string, extraOptions: object = {}) =>
    fastify.register(fastifyAutoLoad, {
      dir: path.join(__dirname, dir),
      options: { ...opts, ...extraOptions },
      autoHooks: true,
      cascadeHooks: true,
    });

  // Loads all external plugins (e.g., database, rate limiting, etc.)
  await autoLoad("plugins/external", {});
  // Loads auth and other app-level hooks before routes
  await autoLoad("plugins/app");

  // Protect all routes except public ones
  fastify.addHook("onRequest", async (request, reply) => {
    const publicPrefixes = [
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/payments/webhook",
      "/api-docs",
    ];

    if (publicPrefixes.some((prefix) => request.url.startsWith(prefix))) {
      return;
    }

    // Apply authentication to all other routes
    await fastify.authenticate(request, reply);
  });

  // Loads all plugins defined in routes
  await autoLoad("routes");

  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error(
        {
          error,
          request: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
          },
        },
        "Unhandled error occurred",
      );

      const status = error.statusCode ?? 500;
      reply.code(status).send({
        message: status < 500 ? error.message : "Internal Server Error",
      });
    },
  );

  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    async (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
          },
        },
        "Resource not found",
      );
      reply.code(httpStatus.NOT_FOUND).send({ message: "Not Found" });
    },
  );
}
