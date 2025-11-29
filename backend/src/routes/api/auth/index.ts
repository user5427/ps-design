import { FastifyInstance } from 'fastify'
import * as bcrypt from 'bcryptjs'
import type { AuthUser } from '../../../plugins/app/auth'

interface ChangePasswordBody { newPassword?: string }

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post('/login', async (request, reply) => {
		const creds = fastify.parseBasicAuth(request)
		if (!creds) return reply.code(401).send({ error: 'Missing Basic Authorization' })
		try {
			const user = await fastify.prisma.user.findUnique({ where: { email: creds.email } })
			if (!user) return reply.code(401).send({ error: 'Invalid credentials' })
			const ok = await bcrypt.compare(creds.password, (user as any).passwordHash)
			if (!ok) return reply.code(401).send({ error: 'Invalid credentials' })
			const u = user as AuthUser
			return reply.send({
				userId: u.id,
				role: u.role,
				businessId: u.businessId,
				isPasswordResetRequired: u.isPasswordResetRequired,
			})
		} catch (e) {
			request.log.error(e, 'Login handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.post('/change-password', async (request, reply) => {
		const creds = fastify.parseBasicAuth(request)
		if (!creds) return reply.code(401).send({ error: 'Missing Basic Authorization' })
		const { newPassword } = (request.body || {}) as ChangePasswordBody
		if (!newPassword || newPassword.length < 8) {
			return reply.code(400).send({ error: 'New password must be at least 8 chars' })
		}
		try {
			const user = await fastify.prisma.user.findUnique({ where: { email: creds.email } })
			if (!user) return reply.code(401).send({ error: 'Invalid credentials' })
			const ok = await bcrypt.compare(creds.password, (user as any).passwordHash)
			if (!ok) return reply.code(401).send({ error: 'Invalid credentials' })
			const hash = await bcrypt.hash(newPassword, 10)
			await fastify.prisma.user.update({
				where: { id: user.id },
				data: { passwordHash: hash, isPasswordResetRequired: false },
			})
			return reply.send({ success: true })
		} catch (e) {
			request.log.error(e, 'Change-password handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})
}
