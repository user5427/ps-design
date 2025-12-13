export interface ICreateGiftCard {
  code: string;
  value: number;
  expiresAt?: Date | null;
  businessId: string;
}

export interface IUpdateGiftCard {
  code?: string;
  value?: number;
  expiresAt?: Date | null;
}
