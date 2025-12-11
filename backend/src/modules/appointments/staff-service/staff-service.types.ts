export interface IStaffService {
  id: string;
  price: number;
  baseDuration: number;
  isDisabled: boolean;
  businessId: string;
  employeeId: string;
  serviceDefinitionId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateStaffService {
  price: number;
  baseDuration: number;
  isDisabled?: boolean;
  businessId: string;
  employeeId: string;
  serviceDefinitionId: string;
}

export interface IUpdateStaffService {
  price?: number;
  baseDuration?: number;
  isDisabled?: boolean;
}
