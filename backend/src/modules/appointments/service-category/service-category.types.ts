export interface IServiceCategory {
  id: string;
  name: string;
  businessId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateServiceCategory {
  name: string;
  businessId: string;
}

export interface IUpdateServiceCategory {
  name?: string;
}
