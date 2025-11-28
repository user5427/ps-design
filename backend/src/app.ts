import { FastifyInstance, FastifyPluginOptions, FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import fastifyAutoLoad from '@fastify/autoload'
import path from 'path'

export default async function serviceApp(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    const autoLoad = (dir: string, extraOptions: object = {}) =>
        fastify.register(fastifyAutoLoad, {
            dir: path.join(__dirname, dir),
            options: { ...opts, ...extraOptions },
            autoHooks: true,
            cascadeHooks: true
        });

    // Loads all external plugins (e.g., database, rate limiting, etc.)
    await autoLoad('plugins/external', {});
    // Loads internal app plugins (should be code that is reused in multiple routes)
    await autoLoad('plugins/app');
    // Loads all plugins defined in routes
    await autoLoad('routes');

    fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        fastify.log.error({
            error,
            request: {
                method: request.method,
                url: request.url,
                params: request.params,
                         query: request.query,
            }
        },
            'Unhandled error occurred');

        const status = error.statusCode ?? 500;
        reply.code(status);
        return {
            message: status < 500 ? error.message : 'Internal Server Error'
        };
    });

    fastify.setNotFoundHandler({
        preHandler: fastify.rateLimit({
            max: 3, timeWindow: 500,
        })
    }, async (request, reply) => {
        request.log.warn({
            request: {
                method: request.method,
                url: request.url,
                params: request.params,
                query: request.query,
            }
        },
            'Resource not found');
        reply.code(404);
        return { message: 'Not Found' };
    });

}