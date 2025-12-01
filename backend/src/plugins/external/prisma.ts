import { PrismaPg } from "@prisma/adapter-pg";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client";

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
