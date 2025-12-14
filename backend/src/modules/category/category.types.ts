export interface ICategory {
  id: string;
  name: string;
  businessId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCategory {
  name: string;
  businessId: string;
}

export interface IUpdateCategory {
  name?: string;
  taxId?: string | null;
}
