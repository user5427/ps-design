import { IsNull, Repository } from "typeorm";
import { Product } from "./product.entity";
import type { ICreateProduct, IUpdateProduct } from "./product.types";
import { NotFoundError, ConflictError, BadRequestError } from "../../../shared/errors";
import { isUniqueConstraintError } from "../../../shared/typeorm-error-utils";
import type { ProductUnit } from "../product-unit/product-unit.entity";

export class ProductService {
    constructor(
        private repository: Repository<Product>,
        private productUnitRepository: Repository<ProductUnit>,
    ) { }

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

    async getById(id: string, businessId: string): Promise<Product> {
        const product = await this.findByIdAndBusinessId(id, businessId);
        if (!product) {
            throw new NotFoundError("Product not found");
        }
        return product;
    }

    async countByProductUnitId(productUnitId: string): Promise<number> {
        return this.repository.count({
            where: { productUnitId, deletedAt: IsNull() },
        });
    }

    async create(data: ICreateProduct): Promise<Product> {
        const unit = await this.productUnitRepository.findOne({
            where: { id: data.productUnitId, businessId: data.businessId, deletedAt: IsNull() },
        });

        if (!unit) {
            throw new BadRequestError("Invalid product unit");
        }

        try {
            const product = this.repository.create(data);
            const saved = await this.repository.save(product);
            return (await this.findById(saved.id))!;
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError("Product with this name already exists");
            }
            throw error;
        }
    }

    async update(id: string, businessId: string, data: IUpdateProduct): Promise<Product> {
        const product = await this.findByIdSimple(id, businessId);
        if (!product) {
            throw new NotFoundError("Product not found");
        }

        if (data.productUnitId) {
            const unit = await this.productUnitRepository.findOne({
                where: { id: data.productUnitId, businessId, deletedAt: IsNull() },
            });

            if (!unit) {
                throw new BadRequestError("Invalid product unit");
            }
        }

        try {
            await this.repository.update(id, data);
            return (await this.findById(id))!;
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError("Product with this name already exists");
            }
            throw error;
        }
    }

    async delete(id: string, businessId: string): Promise<void> {
        const product = await this.findByIdSimple(id, businessId);
        if (!product) {
            throw new NotFoundError("Product not found");
        }

        await this.repository.update(id, { deletedAt: new Date() });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }
}
