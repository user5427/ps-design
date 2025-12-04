export interface IRefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    jti: string;
    expiresAt: Date;
    revokedAt: Date | null;
    ip: string | null;
    createdAt: Date;
}

export interface ICreateRefreshToken {
    userId: string;
    tokenHash: string;
    jti: string;
    expiresAt: Date;
    ip?: string | null;
}
