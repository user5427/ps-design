import { IsNull, Repository } from "typeorm";
import { ProductUnit } from "./product-unit.entity";
import type { ICreateProductUnit, IUpdateProductUnit } from "./product-unit.types";
import { NotFoundError, ConflictError } from "../../shared/errors";
import { isUniqueConstraintError } from "../../shared/typeorm-error-utils";
import type { Product } from "../product/product.entity";

export class ProductUnitService {
    constructor(
        private repository: Repository<ProductUnit>,
        private productRepository: Repository<Product>,
    ) { }

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
        try {
            const unit = this.repository.create(data);
            return await this.repository.save(unit);
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError("Product unit with this name already exists");
            }
            throw error;
        }
    }

    async update(id: string, businessId: string, data: IUpdateProductUnit): Promise<ProductUnit> {
        const unit = await this.findByIdAndBusinessId(id, businessId);
        if (!unit) {
            throw new NotFoundError("Product unit not found");
        }

        try {
            await this.repository.update(id, data);
            return (await this.findById(id))!;
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError("Product unit with this name already exists");
            }
            throw error;
        }
    }

    async delete(id: string, businessId: string): Promise<void> {
        const unit = await this.findByIdAndBusinessId(id, businessId);
        if (!unit) {
            throw new NotFoundError("Product unit not found");
        }

        const productsCount = await this.productRepository.count({
            where: { productUnitId: id, deletedAt: IsNull() },
        });

        if (productsCount > 0) {
            throw new ConflictError("Cannot delete product unit that is in use by products");
        }

        await this.repository.update(id, { deletedAt: new Date() });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
