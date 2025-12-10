// Allow any string for custom variation types
export type MenuItemVariationTypeValue = string;

export interface IMenuItem {
  id: string;
  baseName: string;
  basePrice: number;
  isDisabled: boolean;
  businessId: string;
  categoryId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMenuItemBaseProduct {
  productId: string;
  quantity: number;
}

export interface ICreateMenuItemVariation {
  name: string;
  type: MenuItemVariationTypeValue;
  priceAdjustment: number;
  isDisabled: boolean;
  addonProducts: ICreateMenuItemBaseProduct[];
}

export interface ICreateMenuItem {
  baseName: string;
  basePrice: number;
  categoryId?: string | null;
  isDisabled?: boolean;
  businessId: string;
  baseProducts: ICreateMenuItemBaseProduct[];
  variations: ICreateMenuItemVariation[];
}

export interface IMenuItemVariationInput {
  id?: string;
  name?: string;
  type?: MenuItemVariationTypeValue;
  priceAdjustment?: number;
  isDisabled?: boolean;
  addonProducts?: ICreateMenuItemBaseProduct[];
}

export interface IUpdateMenuItem {
  baseName?: string;
  basePrice?: number;
  categoryId?: string | null;
  isDisabled?: boolean;
  baseProducts?: ICreateMenuItemBaseProduct[];
  variations?: IMenuItemVariationInput[];
  removeVariationIds?: string[];
}
