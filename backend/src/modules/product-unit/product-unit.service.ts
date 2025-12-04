import { IsNull, Repository } from "typeorm";
import { ProductUnit } from "./product-unit.entity";
import type { ICreateProductUnit, IUpdateProductUnit } from "./product-unit.types";

export class ProductUnitService {
    constructor(private repository: Repository<ProductUnit>) { }

    async findAllByBusinessId(businessId: string): Promise<ProductUnit[]> {
        return this.repository.find({
            where: { businessId, deletedAt: IsNull() },
            order: { name: "ASC" },
        });
    }

    async findById(id: string): Promise<ProductUnit | null> {
        return this.repository.findOne({
            where: { id, deletedAt: IsNull() },
        });
    }

    async findByIdAndBusinessId(id: string, businessId: string): Promise<ProductUnit | null> {
        return this.repository.findOne({
            where: { id, businessId, deletedAt: IsNull() },
        });
    }

    async findByNameAndBusinessId(name: string, businessId: string): Promise<ProductUnit | null> {
        return this.repository.findOne({
            where: { name, businessId, deletedAt: IsNull() },
        });
    }

    async create(data: ICreateProductUnit): Promise<ProductUnit> {
        const unit = this.repository.create(data);
        return this.repository.save(unit);
    }

    async update(id: string, data: IUpdateProductUnit): Promise<ProductUnit | null> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
