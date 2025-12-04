import { IsNull, Repository } from "typeorm";
import { RefreshToken } from "./refresh-token.entity";
import type { ICreateRefreshToken } from "./refresh-token.types";

export class RefreshTokenService {
    constructor(private repository: Repository<RefreshToken>) { }

    async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
        return this.repository.findOne({
            where: { tokenHash },
        });
    }

    async findByJti(jti: string): Promise<RefreshToken | null> {
        return this.repository.findOne({
            where: { jti },
        });
    }

    async create(data: ICreateRefreshToken): Promise<RefreshToken> {
        const token = this.repository.create(data);
        return this.repository.save(token);
    }

    async revoke(id: string): Promise<void> {
        await this.repository.update(id, { revokedAt: new Date() });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.repository.update(
            { userId, revokedAt: IsNull() },
            { revokedAt: new Date() }
        );
    }

    async deleteExpired(): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .delete()
            .where("expiresAt < :now", { now: new Date() })
            .execute();
    }
}
