import env from '@fastify/env'

declare module 'fastify' {
    export interface FastifyInstance {
        config: {
            PORT: number,
            RATE_LIMIT_MAX: number,
            FASTIFY_GRACEFUL_SHUTDOWN_DELAY: number,
        };
    }
}

const schema = {
    type: 'object',
    required: [],
    properties: {
        PORT: { type: 'number', default: 3000 },
        RATE_LIMIT_MAX: { type: 'number', default: 100 },
        FASTIFY_GRACEFUL_SHUTDOWN_DELAY: { type: 'number', default: 500 },
    }
}

export const autoConfig = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env
}

export default env