export interface IBusiness {
  id: string;
  name: string;
  isOrderBased: boolean;
  isAppointmentBased: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateBusiness {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isOrderBased?: boolean;
  isAppointmentBased?: boolean;
}

export interface IUpdateBusiness {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface IUpdateBusinessTypes {
  isOrderBased?: boolean;
  isAppointmentBased?: boolean;
}
