export interface ICreateTax {
  countryId: string;
  name: string;
  description?: string | null;
}

export interface IUpdateTax {
  name?: string;
  description?: string | null;
}
