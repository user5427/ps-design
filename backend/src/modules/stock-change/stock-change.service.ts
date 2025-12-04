import { IsNull, Repository } from "typeorm";
import { StockChange } from "./stock-change.entity";
import type { ICreateStockChange } from "./stock-change.types";

export class StockChangeService {
    constructor(private repository: Repository<StockChange>) { }

    async findAllByBusinessId(businessId: string, productId?: string): Promise<StockChange[]> {
        const where: any = { businessId, deletedAt: IsNull() };
        if (productId) {
            where.productId = productId;
        }
        return this.repository.find({
            where,
            relations: ["product", "product.productUnit", "createdBy"],
            order: { createdAt: "DESC" },
        });
    }

    async findById(id: string): Promise<StockChange | null> {
        return this.repository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ["product", "product.productUnit", "createdBy"],
        });
    }

    async findByIdAndBusinessId(id: string, businessId: string): Promise<StockChange | null> {
        return this.repository.findOne({
            where: { id, businessId, deletedAt: IsNull() },
        });
    }

    async create(data: ICreateStockChange): Promise<StockChange> {
        const change = this.repository.create(data);
        const saved = await this.repository.save(change);
        return this.findById(saved.id) as Promise<StockChange>;
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
