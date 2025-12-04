export interface IProductUnit {
  id: string;
  name: string;
  symbol: string | null;
  businessId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProductUnit {
  name: string;
  symbol?: string | null;
  businessId: string;
}

export interface IUpdateProductUnit {
  name?: string;
  symbol?: string | null;
}
