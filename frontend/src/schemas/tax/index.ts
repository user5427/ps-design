export type {
  TaxResponse,
  CreateTaxBody,
  UpdateTaxBody,
  TaxIdParams,
} from "@ps-design/schemas/tax";

export type Tax =
  import("@ps-design/schemas/tax").TaxResponse;
export type CreateTax =
  import("@ps-design/schemas/tax").CreateTaxBody;
export type UpdateTax =
  import("@ps-design/schemas/tax").UpdateTaxBody;
export type TaxId =
  import("@ps-design/schemas/tax").TaxIdParams;
