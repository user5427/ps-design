export interface IStaffService {
  id: string;
  isDisabled: boolean;
  businessId: string;
  employeeId: string;
  serviceDefinitionId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateStaffService {
  isDisabled?: boolean;
  businessId: string;
  employeeId: string;
  serviceDefinitionId: string;
}

export interface IUpdateStaffService {
  isDisabled?: boolean;
}
