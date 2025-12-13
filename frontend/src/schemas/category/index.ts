// Re-export all category types from the shared schemas package
export type {
  CategoryResponse,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "@ps-design/schemas/category";

export type Category = import("@ps-design/schemas/category").CategoryResponse;
export type CreateCategory =
  import("@ps-design/schemas/category").CreateCategoryBody;
export type UpdateCategory =
  import("@ps-design/schemas/category").UpdateCategoryBody;
