import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest } from 'fastify'

export interface AuthUser {
  id: string
  businessId: string | null
  email: string
  role: string
  isPasswordResetRequired: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>
  }
}

export default fp(async function authGuard(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: any) {
    try {
      await request.jwtVerify()

      const jwtUser = request.user as { userId: string; role: string; businessId: string | null }

      const user = await fastify.prisma.user.findUnique({
        where: { id: jwtUser.userId },
        select: {
          id: true,
          email: true,
          role: true,
          businessId: true,
          isPasswordResetRequired: true,
        },
      })

      if (!user) {
        return reply.unauthorized('User not found')
      }

      request.authUser = user as AuthUser
    } catch (err) {
      return reply.unauthorized('Unauthorized')
    }
  })
})
