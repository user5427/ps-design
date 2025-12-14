export interface ICreateTax {
  businessId: string;
  name: string;
  rate: number;
  description?: string | null;
}

export interface IUpdateTax {
  name?: string;
  rate?: number;
  description?: string | null;
}
