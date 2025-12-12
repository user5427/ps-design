// Re-export all inventory types from the shared schemas package
export type {
  ProductUnitResponse,
  CreateProductUnitBody,
  UpdateProductUnitBody,
} from "@ps-design/schemas/inventory/units";

export type {
  ProductResponse,
  CreateProductBody,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/products";

export type {
  StockLevelResponse,
  StockChangeResponse,
  CreateStockChangeBody,
  StockChangeType,
} from "@ps-design/schemas/inventory/stock";

export { StockChangeTypeEnum } from "@ps-design/schemas/inventory/stock";

// Type aliases for backward compatibility
export type ProductUnit =
  import("@ps-design/schemas/inventory/units").ProductUnitResponse;
export type CreateProductUnit =
  import("@ps-design/schemas/inventory/units").CreateProductUnitBody;
export type UpdateProductUnit =
  import("@ps-design/schemas/inventory/units").UpdateProductUnitBody;

export type Product =
  import("@ps-design/schemas/inventory/products").ProductResponse;
export type CreateProduct =
  import("@ps-design/schemas/inventory/products").CreateProductBody;
export type UpdateProduct =
  import("@ps-design/schemas/inventory/products").UpdateProductBody;

export type StockLevel =
  import("@ps-design/schemas/inventory/stock").StockLevelResponse;
export type StockChange =
  import("@ps-design/schemas/inventory/stock").StockChangeResponse;
export type CreateStockChange =
  import("@ps-design/schemas/inventory/stock").CreateStockChangeBody;
