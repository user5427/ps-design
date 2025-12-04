export enum StockChangeType {
  SUPPLY = "SUPPLY",
  USAGE = "USAGE",
  ADJUSTMENT = "ADJUSTMENT",
  WASTE = "WASTE",
}

export interface IStockChange {
  id: string;
  quantity: number;
  type: StockChangeType;
  expirationDate: Date | null;
  businessId: string;
  productId: string;
  createdByUserId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface ICreateStockChange {
  quantity: number;
  type: StockChangeType;
  expirationDate?: string | null;
  businessId: string;
  productId: string;
  createdByUserId: string;
}
