import { FastifyInstance } from 'fastify'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { AuthUser } from '../../../plugins/app/auth'

const loginSchema = z.object({
	email: z.email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export default async function authRoutes(fastify: FastifyInstance) {
	const server = fastify.withTypeProvider<ZodTypeProvider>()

	server.post('/login', {
		schema: {
			body: loginSchema,
		},
	}, async (request, reply) => {
		const { email, password } = request.body

		try {
			const user = await fastify.prisma.user.findUnique({
				where: { email },
			})

			if (!user) {
				return reply.code(401).send({ error: 'Invalid credentials' })
			}

			const isValidPassword = await bcrypt.compare(password, user.passwordHash)
			if (!isValidPassword) {
				return reply.code(401).send({ error: 'Invalid credentials' })
			}

			const token = await reply.jwtSign({
				userId: user.id,
				role: user.role,
				businessId: user.businessId,
			})

			// Set httpOnly cookie
			reply.setCookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
				maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
			})

			return reply.send({
				userId: user.id,
				email: user.email,
				role: user.role,
				businessId: user.businessId,
				isPasswordResetRequired: user.isPasswordResetRequired,
			})
		} catch (e) {
			request.log.error(e, 'Login handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	server.post('/logout', async (request, reply) => {
		reply.clearCookie('token', { path: '/' })
		return reply.send({ success: true })
	})

	server.get('/me', async (request, reply) => {
		const user = (request as any).user as AuthUser | undefined
		if (!user) {
			return reply.code(401).send({ error: 'Unauthorized' })
		}

		return reply.send({
			userId: user.id,
			email: user.email,
			role: user.role,
			businessId: user.businessId,
			isPasswordResetRequired: user.isPasswordResetRequired,
		})
	})

	server.post('/change-password', {
		schema: {
			body: changePasswordSchema,
		},
	}, async (request, reply) => {
		const { currentPassword, newPassword } = request.body

		const user = (request as any).user as AuthUser | undefined
		if (!user) {
			return reply.code(401).send({ error: 'Unauthorized' })
		}

		try {
			const dbUser = await fastify.prisma.user.findUnique({
				where: { id: user.id },
			})

			if (!dbUser) {
				return reply.code(401).send({ error: 'User not found' })
			}

			const isValidPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash)
			if (!isValidPassword) {
				return reply.code(401).send({ error: 'Invalid current password' })
			}

			const hash = await bcrypt.hash(newPassword, 10)
			await fastify.prisma.user.update({
				where: { id: user.id },
				data: {
					passwordHash: hash,
					isPasswordResetRequired: false,
				},
			})

			return reply.code(200).send({ success: true })
		} catch (e) {
			request.log.error(e, 'Change-password handler failed')
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})
}
