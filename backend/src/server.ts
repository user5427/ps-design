import Fastify from 'fastify'
import serviceApp from "./app"
import envPlugin, { autoConfig as envOptions } from "./plugins/config/env";
import closeWithGrace from 'close-with-grace'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyCors from '@fastify/cors'
import swaggerDocument from './generated/swagger-output.json'

const app = Fastify({
    logger: true
})

async function init() {
    await app.register(envPlugin, envOptions);

    // Register CORS - allow all origins
    await app.register(fastifyCors, {
        origin: true,
        credentials: true
    })

    // Register Swagger
    await app.register(fastifySwagger, {
        mode: 'static',
        specification: {
            document: swaggerDocument
        }
    })

    await app.register(fastifySwaggerUI, {
        routePrefix: '/api-docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        }
    })

    await app.register(serviceApp)

    closeWithGrace(
        { delay: app.config.FASTIFY_GRACEFUL_SHUTDOWN_DELAY },
        async ({ err }) => {
            if (err) app.log.error(err);
            await app.close();
        })

    await app.ready()

    try {
        await app.listen({ port: app.config.PORT, host: "0.0.0.0", })
        app.log.info(`Swagger docs available at http://0.0.0.0:${app.config.PORT}/api-docs`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

init()
