import type { FastifyReply } from "fastify";
import { AppError, isAppError } from "./errors";

export function handleServiceError(
  error: unknown,
  reply: FastifyReply,
): FastifyReply {
  if (isAppError(error)) {
    return reply.code(error.statusCode).send({ message: error.message });
  }
  throw error;
}
