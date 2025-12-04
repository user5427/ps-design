export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
}

export interface IUser {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
    isPasswordResetRequired: boolean;
    businessId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateUser {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
    isPasswordResetRequired?: boolean;
    businessId?: string | null;
}

export interface IUpdateUser {
    email?: string;
    passwordHash?: string;
    name?: string;
    role?: Role;
    isPasswordResetRequired?: boolean;
    businessId?: string | null;
}

export interface IAuthUser {
    id: string;
    email: string;
    role: string;
    businessId: string | null;
    isPasswordResetRequired: boolean;
}
