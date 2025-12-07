export interface ICreateCountry {
  name: string;
  code: string;
  description?: string | null;
}

export interface IUpdateCountry {
  name?: string;
  code?: string;
  description?: string | null;
}
