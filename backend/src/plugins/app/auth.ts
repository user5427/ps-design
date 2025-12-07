import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import HttpStatus from "http-status";
import type { IAuthUser } from '@/modules/user';

declare module "fastify" {
  interface FastifyRequest {
    authUser?: IAuthUser;
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export default fp(async function authGuard(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const jwtUser = request.user as {
          userId: string;
          role: string;
          businessId: string | null;
        };

        const user = await fastify.db.user.findByIdForAuth(jwtUser.userId);

        if (!user) {
          return reply.code(HttpStatus.UNAUTHORIZED).send();
        }

        request.authUser = user;
      } catch (err) {
        return reply.code(HttpStatus.UNAUTHORIZED).send();
      }
    },
  );
});
