import * as bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

// Minimal subset of User fields needed for auth
export interface AuthUser {
  id: string;
  businessId: string | null;
  email: string;
  passwordHash: string;
  role: string;
  isPasswordResetRequired: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
  interface FastifyInstance {
    parseBasicAuth: (
      req: FastifyRequest,
    ) => { email: string; password: string } | null;
  }
}

function parseBasicAuth(
  req: FastifyRequest,
): { email: string; password: string } | null {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  if (sep === -1) return null;
  return { email: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
}

export default fp(async function authGuard(fastify: FastifyInstance) {
  fastify.decorate("parseBasicAuth", parseBasicAuth);

  fastify.addHook("onRequest", async (request, reply) => {
    if (request.url?.startsWith("/auth")) return;

    const creds = fastify.parseBasicAuth(request);
    if (!creds) {
      return reply.code(401).send({ error: "Missing Basic Authorization" });
    }
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { email: creds.email },
      });
      if (!user) return reply.code(401).send({ error: "Invalid credentials" });

      const ok = await bcrypt.compare(
        creds.password,
        (user as any).passwordHash,
      );
      if (!ok) return reply.code(401).send({ error: "Invalid credentials" });

      if ((user as any).isPasswordResetRequired) {
        return reply.code(403).send({
          error: "Password reset required",
          action: "/auth/change-password",
        });
      }
      // Cast to AuthUser subset
      request.user = user as AuthUser;
    } catch (e) {
      request.log.error(e, "Auth middleware failed");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
});
