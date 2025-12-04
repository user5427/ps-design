import { Repository } from "typeorm";
import { StockLevel } from "./StockLevel.entity";
import type { ICreateStockLevel } from "./StockLevel.types";

export class StockLevelService {
    constructor(private repository: Repository<StockLevel>) { }

    async findByProductId(productId: string): Promise<StockLevel | null> {
        return this.repository.findOne({
            where: { productId },
        });
    }

    async findAllByBusinessId(businessId: string): Promise<StockLevel[]> {
        return this.repository.find({
            where: { businessId },
        });
    }

    async upsert(data: ICreateStockLevel): Promise<StockLevel> {
        const existing = await this.findByProductId(data.productId);
        if (existing) {
            const newQuantity = existing.quantity + data.quantity;
            await this.repository.update(existing.id, { quantity: newQuantity });
            return this.findByProductId(data.productId) as Promise<StockLevel>;
        }
        const level = this.repository.create(data);
        return this.repository.save(level);
    }

    async incrementQuantity(productId: string, amount: number): Promise<void> {
        const existing = await this.findByProductId(productId);
        if (existing) {
            const newQuantity = existing.quantity + amount;
            await this.repository.update(existing.id, { quantity: newQuantity });
        }
    }

    async decrementQuantity(productId: string, amount: number): Promise<void> {
        const existing = await this.findByProductId(productId);
        if (existing) {
            const newQuantity = existing.quantity - amount;
            await this.repository.update(existing.id, { quantity: newQuantity });
        }
    }
}
