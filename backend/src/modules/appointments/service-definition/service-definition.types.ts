export interface IServiceDefinition {
  id: string;
  name: string;
  description: string | null;
  isDisabled: boolean;
  businessId: string;
  categoryId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateServiceDefinition {
  name: string;
  description?: string | null;
  isDisabled?: boolean;
  businessId: string;
  categoryId?: string | null;
}

export interface IUpdateServiceDefinition {
  name?: string;
  description?: string | null;
  isDisabled?: boolean;
  categoryId?: string | null;
}
