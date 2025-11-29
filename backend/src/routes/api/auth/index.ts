import { FastifyInstance } from 'fastify'
import * as bcrypt from 'bcryptjs'

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post('/auth/login', async (request, reply) => {
		try {
			const parse = (fastify as any).parseBasicAuth as (req: any) => { email: string; password: string } | null
			const creds = parse ? parse(request) : null
			if (!creds) return reply.code(401).send({ error: 'Missing Basic Authorization' })

			const user = await fastify.prisma.user.findUnique({ where: { email: creds.email } })
			if (!user) return reply.code(401).send({ error: 'Invalid credentials' })

			const ok = await bcrypt.compare(creds.password, (user as any).passwordHash)
			if (!ok) return reply.code(401).send({ error: 'Invalid credentials' })

			return reply.send({
				userId: (user as any).id,
				role: (user as any).role,
				businessId: (user as any).businessId,
				isPasswordResetRequired: (user as any).isPasswordResetRequired,
			})
		} catch (e) {
			request.log.error(e, 'Login handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.post('/auth/change-password', async (request, reply) => {
		try {
			const parse = (fastify as any).parseBasicAuth as (req: any) => { email: string; password: string } | null
			const creds = parse ? parse(request) : null
			if (!creds) return reply.code(401).send({ error: 'Missing Basic Authorization' })

			const { newPassword } = (request.body || {}) as { newPassword?: string }
			if (!newPassword || newPassword.length < 8) {
				return reply.code(400).send({ error: 'New password must be at least 8 chars' })
			}

			const user = await fastify.prisma.user.findUnique({ where: { email: creds.email } })
			if (!user) return reply.code(401).send({ error: 'Invalid credentials' })

			const ok = await bcrypt.compare(creds.password, (user as any).passwordHash)
			if (!ok) return reply.code(401).send({ error: 'Invalid credentials' })

			const hash = await bcrypt.hash(newPassword, 10)
			await fastify.prisma.user.update({
				where: { id: (user as any).id },
				data: { passwordHash: hash, isPasswordResetRequired: false },
			})
			return reply.send({ success: true })
		} catch (e) {
			request.log.error(e, 'Change-password handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})
}
