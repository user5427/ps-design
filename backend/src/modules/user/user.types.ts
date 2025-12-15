export interface ICreateUser {
  email: string;
  passwordHash: string;
  name: string;
  isPasswordResetRequired?: boolean;
  businessId: string;
}

export interface IUpdateUser {
  email?: string;
  passwordHash?: string;
  name?: string;
  isPasswordResetRequired?: boolean;
  businessId?: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  businessId: string;
  isPasswordResetRequired: boolean;
  roleIds: string[];
}
