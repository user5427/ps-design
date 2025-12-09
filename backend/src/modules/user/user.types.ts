export interface ICreateUser {
  email: string;
  passwordHash: string;
  name: string;
  isPasswordResetRequired?: boolean;
  businessId?: string | null;
}

export interface IUpdateUser {
  email?: string;
  passwordHash?: string;
  name?: string;
  isPasswordResetRequired?: boolean;
  businessId?: string | null;
}

export interface IAuthUser {
  id: string;
  email: string;
  businessId: string | null;
  isPasswordResetRequired: boolean;
  roleIds: string[];
}
