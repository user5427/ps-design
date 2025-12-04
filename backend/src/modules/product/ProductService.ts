import { IsNull, Repository } from "typeorm";
import { Product } from "./Product.entity";
import type { ICreateProduct, IUpdateProduct } from "./Product.types";

export class ProductService {
    constructor(private repository: Repository<Product>) { }

    async findAllByBusinessId(businessId: string): Promise<Product[]> {
        return this.repository.find({
            where: { businessId, deletedAt: IsNull() },
            relations: ["productUnit", "stockLevel"],
            order: { name: "ASC" },
        });
    }

    async findById(id: string): Promise<Product | null> {
        return this.repository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ["productUnit", "stockLevel"],
        });
    }

    async findByIdAndBusinessId(id: string, businessId: string): Promise<Product | null> {
        return this.repository.findOne({
            where: { id, businessId, deletedAt: IsNull() },
            relations: ["productUnit", "stockLevel"],
        });
    }

    async findByIdSimple(id: string, businessId: string): Promise<Product | null> {
        return this.repository.findOne({
            where: { id, businessId, deletedAt: IsNull() },
        });
    }

    async countByProductUnitId(productUnitId: string): Promise<number> {
        return this.repository.count({
            where: { productUnitId, deletedAt: IsNull() },
        });
    }

    async create(data: ICreateProduct): Promise<Product> {
        const product = this.repository.create(data);
        const saved = await this.repository.save(product);
        return this.findById(saved.id) as Promise<Product>;
    }

    async update(id: string, data: IUpdateProduct): Promise<Product | null> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
