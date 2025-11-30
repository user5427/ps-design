import env from '@fastify/env'

declare module 'fastify' {
    export interface FastifyInstance {
        config: {
            DATABASE_URL: string,
            PORT: number,
            RATE_LIMIT_MAX: number,
            FASTIFY_GRACEFUL_SHUTDOWN_DELAY: number,
            JWT_SECRET: string,
            NODE_ENV: string,
            ACCESS_COOKIE_MAX_AGE: number
        };
    }
}

const schema = {
    type: 'object',
    required: ['DATABASE_URL', 'JWT_SECRET'],
    properties: {
        DATABASE_URL: { type: 'string' },
        PORT: { type: 'number', default: 3000 },
        RATE_LIMIT_MAX: { type: 'number', default: 100 },
        FASTIFY_GRACEFUL_SHUTDOWN_DELAY: { type: 'number', default: 500 },
        JWT_SECRET: { type: 'string' },
        NODE_ENV: { type: 'string', default: 'development' },
        ACCESS_COOKIE_MAX_AGE: { type: 'number', default: 7 * 24 * 60 * 60 } // 7 days
    }
}

export const autoConfig = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env
}

export default env