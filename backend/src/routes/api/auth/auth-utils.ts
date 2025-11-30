import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as crypto from 'crypto'
import type { RefreshToken, User } from '../../../generated/prisma/client'

export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

export function createJti(): string {
    return crypto.randomBytes(16).toString('hex')
}

export function signAccessToken(fastify: FastifyInstance, user: User): string {
    const payload = {
        userId: user.id,
        role: user.role,
        businessId: user.businessId,
    }
    return fastify.jwt.sign(payload, { expiresIn: fastify.config.ACCESS_TOKEN_TTL })
}

export function signRefreshToken(
    fastify: FastifyInstance,
    userId: string,
    jti: string
): string {
    const payload: any = { userId, jti }
    return fastify.jwt.sign(payload, {
        key: fastify.config.REFRESH_TOKEN_SECRET,
        expiresIn: fastify.config.REFRESH_TOKEN_TTL_SEC,
    })
}

export async function persistRefreshToken(
    fastify: FastifyInstance,
    params: {
        userId: string
        refreshToken: string
        jti: string
        ip?: string
    }
): Promise<void> {
    const tokenHash = hashToken(params.refreshToken)
    const expiresAt = new Date(Date.now() + fastify.config.REFRESH_TOKEN_TTL_SEC * 1000)

    await fastify.prisma.refreshToken.create({
        data: {
            userId: params.userId,
            tokenHash,
            jti: params.jti,
            expiresAt,
            ip: params.ip,
        },
    })
}

export function setRefreshCookie(
    fastify: FastifyInstance,
    reply: FastifyReply,
    refreshToken: string
): void {
    const isProd = fastify.config.NODE_ENV === 'production'
    reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: fastify.config.REFRESH_TOKEN_TTL_SEC,
    })
}

export async function rotateRefreshToken(
    fastify: FastifyInstance,
    oldToken: RefreshToken,
    userId: string,
    request: FastifyRequest,
    reply: FastifyReply
): Promise<{ accessToken: string }> {
    await fastify.prisma.refreshToken.update({
        where: { id: oldToken.id },
        data: { revokedAt: new Date() },
    })

    const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user) {
        throw new Error('User not found')
    }

    const newJti = createJti()
    const newAccessToken = signAccessToken(fastify, user)
    const newRefreshToken = signRefreshToken(fastify, userId, newJti)

    await persistRefreshToken(fastify, {
        userId,
        refreshToken: newRefreshToken,
        jti: newJti,
        ip: request.ip,
    })

    setRefreshCookie(fastify, reply, newRefreshToken)

    return { accessToken: newAccessToken }
}