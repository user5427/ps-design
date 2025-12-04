import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";

export function getBusinessId(
  request: FastifyRequest,
  reply: FastifyReply,
): string | null {
  const user = request.authUser;
  if (!user) {
    reply.code(httpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
    return null;
  }
  if (!user.businessId) {
    reply
      .code(httpStatus.FORBIDDEN)
      .send({ message: "User is not associated with a business" });
    return null;
  }
  return user.businessId;
}
