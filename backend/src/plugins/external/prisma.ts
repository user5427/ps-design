import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const pool = new pg.Pool({
    connectionString: fastify.config.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
    await pool.end();
  });
});
