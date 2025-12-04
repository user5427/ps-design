export interface IBusiness {
    id: string;
    name: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateBusiness {
    name: string;
}

export interface IUpdateBusiness {
    name?: string;
}
