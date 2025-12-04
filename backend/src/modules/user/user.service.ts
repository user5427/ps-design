import { IsNull, Repository } from "typeorm";
import { User } from "./user.entity";
import type { ICreateUser, IUpdateUser, IAuthUser } from "./user.types";

export class UserService {
    constructor(private repository: Repository<User>) { }

    async findAll(): Promise<User[]> {
        return this.repository.find({
            where: { deletedAt: IsNull() },
            order: { name: "ASC" },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findOne({
            where: { id, deletedAt: IsNull() },
        });
    }

    async findByIdForAuth(id: string): Promise<IAuthUser | null> {
        const user = await this.repository.findOne({
            where: { id, deletedAt: IsNull() },
            select: ["id", "email", "role", "businessId", "isPasswordResetRequired"],
        });
        return user as IAuthUser | null;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({
            where: { email, deletedAt: IsNull() },
        });
    }

    async findByBusinessId(businessId: string): Promise<User[]> {
        return this.repository.find({
            where: { businessId, deletedAt: IsNull() },
            order: { name: "ASC" },
        });
    }

    async create(data: ICreateUser): Promise<User> {
        const user = this.repository.create({
            ...data,
            isPasswordResetRequired: data.isPasswordResetRequired ?? true,
        });
        return this.repository.save(user);
    }

    async update(id: string, data: IUpdateUser): Promise<User | null> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    async upsertByEmail(data: ICreateUser): Promise<User> {
        const existing = await this.findByEmail(data.email);
        if (existing) {
            return existing;
        }
        return this.create(data);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
