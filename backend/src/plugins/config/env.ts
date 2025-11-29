import env from "@fastify/env";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      DATABASE_URL: string;
      PORT: number;
      RATE_LIMIT_MAX: number;
      FASTIFY_GRACEFUL_SHUTDOWN_DELAY: number;
    };
  }
}

const schema = {
  type: "object",
  required: ["DATABASE_URL"],
  properties: {
    DATABASE_URL: { type: "string" },
    PORT: { type: "number", default: 3000 },
    RATE_LIMIT_MAX: { type: "number", default: 100 },
    FASTIFY_GRACEFUL_SHUTDOWN_DELAY: { type: "number", default: 500 },
  },
};

export const autoConfig = {
  confKey: "config",
  schema,
  dotenv: true,
  data: process.env,
};

export default env;
