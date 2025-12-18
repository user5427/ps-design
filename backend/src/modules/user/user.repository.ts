import { IsNull, type Repository } from "typeorm";
import type { User } from "./user.entity";
import type { IAuthUser, ICreateUser, IUpdateUser } from "./user.types";

export class UserRepository {
  constructor(private repository: Repository<User>) {}

  async findAll(): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.business", "business")
      .where("user.deletedAt IS NULL")
      .orderBy("user.name", "ASC")
      .getMany();
  }

  async findById(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.business", "business")
      .where("user.id = :id", { id })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
  }

  async findByIdForAuth(id: string): Promise<IAuthUser | null> {
    const user = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      select: ["id", "email", "businessId", "isPasswordResetRequired"],
      relations: ["roles"],
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      businessId: user.businessId,
      isPasswordResetRequired: user.isPasswordResetRequired,
      roleIds: user.roles?.map((ur) => ur.roleId) ?? [],
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async findByBusinessId(businessId: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.business", "business")
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.deletedAt IS NULL")
      .andWhere("user.isTempUser = false")
      .orderBy("user.name", "ASC")
      .getMany();
  }

  async create(data: ICreateUser): Promise<User> {
    const userExists = await this.findByEmail(data.email);
    if (userExists) {
      throw new Error("User with this email already exists");
    }
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

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
