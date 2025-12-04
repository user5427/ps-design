export interface IStockLevel {
    id: string;
    businessId: string;
    productId: string;
    quantity: number;
    updatedAt: Date;
}

export interface ICreateStockLevel {
    businessId: string;
    productId: string;
    quantity: number;
}

export interface IUpdateStockLevel {
    quantity: number;
}
