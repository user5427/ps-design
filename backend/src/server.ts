// Require the framework and instantiate it

// ESM
import 'dotenv/config'
import Fastify from "fastify";
import { PrismaClient } from "./generated/prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Fail fast with a clear message instead of 500s at runtime
  console.error('DATABASE_URL is not set. Please configure it in .env or environment.');
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString,
});

// Logging is added for dev, in production it should be disabled or reduced
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
  errorFormat: "pretty",
  adapter,
});

const fastify = Fastify({
  logger: true,
});

function parseBasicAuth(req: any) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Basic ")) return null;
  const base64 = header.slice(6);
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  if (sep === -1) return null;
  const email = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);
  return { email, password };
}

// Login endpoint: validates Basic Auth; returns flags
fastify.post("/auth/login", async function (request, reply) {
  try {
    const creds = parseBasicAuth(request);
    if (!creds) {
      return reply.code(401).send({ error: "Missing Basic Authorization" });
    }
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(creds.password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });
    return reply.send({
      userId: user.id,
      role: user.role,
      businessId: user.businessId,
      isPasswordResetRequired: user.isPasswordResetRequired,
    });
  } catch (e: any) {
    request.log.error(e, 'Login handler failed');
    return reply.code(500).send({ error: 'Internal Server Error' })
  }
});

fastify.post("/auth/change-password", async function (request, reply) {
  try {
    const creds = parseBasicAuth(request);
    if (!creds) {
      return reply.code(401).send({ error: "Missing Basic Authorization" });
    }
    const { newPassword } = (request.body || {}) as { newPassword?: string };
    if (!newPassword || newPassword.length < 8) {
      return reply
        .code(400)
        .send({ error: "New password must be at least 8 chars" });
    }
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(creds.password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, isPasswordResetRequired: false },
    });
    return reply.send({ success: true });
  } catch (e: any) {
    request.log.error(e, 'Change-password handler failed');
    return reply.code(500).send({ error: 'Internal Server Error' })
  }
});

// Protect subsequent routes: block if reset required
fastify.addHook("onRequest", async (request, reply) => {
  if (request.url?.startsWith("/auth")) return;
  try {
    const creds = parseBasicAuth(request);
    if (!creds)
      return reply.code(401).send({ error: "Missing Basic Authorization" });
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(creds.password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });
    if (user.isPasswordResetRequired) {
      return reply.code(403).send({
        error: "Password reset required",
        action: "/auth/change-password",
      });
    }
    // Attach user to request for handlers
    (request as any).user = user;
  } catch (e: any) {
    request.log.error(e, 'Auth middleware failed')
    return reply.code(500).send({ error: 'Internal Server Error' })
  }
});

fastify.get("/me", async function (request, reply) {
  const user = (request as any).user;
  return reply.send({ id: user.id, email: user.email, role: user.role });
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
