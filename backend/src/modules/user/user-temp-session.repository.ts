import type { Repository } from "typeorm";
import type { UserTempSession } from "./user-temp-session.entity";

export class UserTempSessionRepository {
  constructor(private repository: Repository<UserTempSession>) {}

  async findByOriginalUserId(
    originalUserId: string,
  ): Promise<UserTempSession | null> {
    return this.repository.findOne({
      where: { originalUserId },
    });
  }

  async create(data: {
    originalUserId: string;
    tempUserId: string;
  }): Promise<UserTempSession> {
    const session = this.repository.create(data);
    return this.repository.save(session);
  }

  async deleteByOriginalUserId(originalUserId: string): Promise<void> {
    await this.repository.delete({ originalUserId });
  }

  async deleteByTempUserId(tempUserId: string): Promise<void> {
    await this.repository.delete({ tempUserId });
  }
}
