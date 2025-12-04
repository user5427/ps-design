import { IsNull, Repository } from "typeorm";
import { Business } from "./Business.entity";
import type { ICreateBusiness, IUpdateBusiness } from "./Business.types";

export class BusinessService {
    constructor(private repository: Repository<Business>) { }

    async findAll(): Promise<Business[]> {
        return this.repository.find({
            where: { deletedAt: IsNull() },
            order: { name: "ASC" },
        });
    }

    async findById(id: string): Promise<Business | null> {
        return this.repository.findOne({
            where: { id, deletedAt: IsNull() },
        });
    }

    async findByName(name: string): Promise<Business | null> {
        return this.repository.findOne({
            where: { name, deletedAt: IsNull() },
        });
    }

    async create(data: ICreateBusiness): Promise<Business> {
        const business = this.repository.create(data);
        return this.repository.save(business);
    }

    async update(id: string, data: IUpdateBusiness): Promise<Business | null> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
