export interface IMenuItemCategory {
  id: string;
  name: string;
  businessId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMenuItemCategory {
  name: string;
  businessId: string;
}

export interface IUpdateMenuItemCategory {
  name?: string;
}
