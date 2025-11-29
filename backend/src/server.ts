import Fastify from 'fastify'
import serviceApp from "./app"
import envPlugin, { autoConfig as envOptions } from "./plugins/config/env";
import closeWithGrace from 'close-with-grace'

const app = Fastify({
  logger: true
})

async function init() {
  await app.register(envPlugin, envOptions);

  app.register(serviceApp)

  closeWithGrace(
  { delay: app.config.FASTIFY_GRACEFUL_SHUTDOWN_DELAY },
    async ({ err }) => {
    if (err) app.log.error(err);
    await app.close();
  })

  await app.ready()

  try {
    await app.listen({ port: app.config.PORT, host: "0.0.0.0", })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

init()
