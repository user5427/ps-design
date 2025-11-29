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
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>
  }
}

export default fp(async function authGuard(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: any) {
    try {
      // Verify JWT from cookie
      await request.jwtVerify()

      // Fetch user from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: (request.user as any).userId },
        select: {
          id: true,
          email: true,
          role: true,
          businessId: true,
          isPasswordResetRequired: true,
        },
      })

      if (!user) {
        return reply.code(401).send({ error: 'User not found' })
      }

      // Attach user to request
      ; (request as any).user = user as AuthUser
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})
