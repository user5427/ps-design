import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { AuthUser } from '../../../plugins/app/auth'

const SALT_LENGTH = 10

const loginSchema = z.object({
	email: z.email('Invalid email format'),
	password: z.string().min(1, 'Password is required')
})

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

type LoginBody = z.infer<typeof loginSchema>
type ChangePasswordBody = z.infer<typeof changePasswordSchema>

function publicUserData(user: AuthUser) {
	return {
		userId: user.id,
		email: user.email,
		role: user.role,
		businessId: user.businessId,
		isPasswordResetRequired: user.isPasswordResetRequired
	}
}

export default async function authRoutes(fastify: FastifyInstance) {
	const server = fastify.withTypeProvider<ZodTypeProvider>()

	server.post(
		'/login',
		{
			schema: { body: loginSchema }
		},
		async (
			request: FastifyRequest<{ Body: LoginBody }>,
			reply: FastifyReply
		) => {
			const { email, password } = request.body

			try {
				const user = await fastify.prisma.user.findUnique({
					where: { email }
				})

				if (!user) return reply.unauthorized()

				const ok = await bcrypt.compare(password, user.passwordHash)
				if (!ok) return reply.unauthorized()

				const token = await reply.jwtSign({
					userId: user.id,
					role: user.role,
					businessId: user.businessId
				})

				reply.setCookie('token', token, {
					httpOnly: true,
					secure: fastify.config.NODE_ENV === 'production',
					sameSite: 'lax',
					path: '/',
					maxAge: fastify.config.ACCESS_COOKIE_MAX_AGE
				})

				return reply.send(publicUserData(user))
			} catch (err) {
				request.log.error({ err }, 'Login handler failed')
				return reply.internalServerError()
			}
		}
	)

	server.post(
		'/logout',
		async (_: FastifyRequest, reply: FastifyReply) => {
			return reply.clearCookie('token', { path: '/' }).send({ success: true })
		}
	)

	server.get(
		'/me',
		async (request: FastifyRequest, reply: FastifyReply) => {
			const user = request.authUser
			if (!user) return reply.unauthorized()
			return reply.send(publicUserData(user))
		}
	)

	server.post(
		'/change-password',
		{
			schema: { body: changePasswordSchema }
		},
		async (
			request: FastifyRequest<{ Body: ChangePasswordBody }>,
			reply: FastifyReply
		) => {
			const { currentPassword, newPassword } = request.body
			const user = request.authUser

			if (!user) return reply.unauthorized()

			try {
				const dbUser = await fastify.prisma.user.findUnique({
					where: { id: user.id },
					select: { passwordHash: true }
				})

				if (!dbUser) return reply.unauthorized()

				const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
				if (!valid) return reply.unauthorized()

				const newHash = await bcrypt.hash(newPassword, SALT_LENGTH)

				await fastify.prisma.user.update({
					where: { id: user.id },
					data: {
						passwordHash: newHash,
						isPasswordResetRequired: false
					}
				})

				return reply.send({ success: true })
			} catch (err) {
				request.log.error({ err }, 'Change-password handler failed')
				return reply.internalServerError()
			}
		}
	)
}
