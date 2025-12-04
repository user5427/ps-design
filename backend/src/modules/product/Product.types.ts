import type { ProductUnit } from "../product-unit/ProductUnit.entity";
import type { StockLevel } from "../stock-level/StockLevel.entity";

export interface IProduct {
    id: string;
    name: string;
    description: string | null;
    isDisabled: boolean;
    businessId: string;
    productUnitId: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateProduct {
    name: string;
    description?: string | null;
    businessId: string;
    productUnitId: string;
}

export interface IUpdateProduct {
    name?: string;
    description?: string | null;
    productUnitId?: string;
    isDisabled?: boolean;
}

export interface IProductWithRelations extends IProduct {
    productUnit: ProductUnit;
    stockLevel: StockLevel | null;
}
