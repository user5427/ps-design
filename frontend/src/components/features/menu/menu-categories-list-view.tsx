import type React from "react";
import {
  useCreateMenuCategory,
  useBulkDeleteMenuCategories,
  useUpdateMenuCategory,
} from "@/queries/menu";
import { MENU_ITEM_CATEGORY_MAPPING } from "@ps-design/constants/menu/category";
import { FormText } from "@/components/elements/form-builder";
import { ListManager } from "@/components/elements/list-manager";

// Define the form schema once
const menuCategoryForm: (form: any) => React.ReactNode = (form) => (
  <form.Field
    name="name"
    defaultValue=""
    validators={{
      onChange: ({ value }: { value: unknown }) => {
        if (!value || String(value).trim().length === 0) {
          return "Name is required";
        }
        if (String(value).length < 1) {
          return "Name must be at least 1 character";
        }
        if (String(value).length > 50) {
          return "Name must be at most 50 characters";
        }
        return undefined;
      },
    }}
  >
    {(field: any) => (
      <FormText
        fieldName="name"
        label="Name"
        value={field.state.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        error={field.state.meta.errors.length > 0}
        helperText={field.state.meta.errors[0] || ""}
        type="text"
        required
      />
    )}
  </form.Field>
);

export const MenuCategoriesListView = () => {
  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();
  const bulkDeleteMutation = useBulkDeleteMenuCategories();

  return (
    <ListManager
      mapping={MENU_ITEM_CATEGORY_MAPPING}
      createForm={menuCategoryForm}
      editForm={menuCategoryForm}
      onCreate={async (values) => {
        await createMutation.mutateAsync({
          name: String(values.name),
        });
      }}
      onEdit={async (id, values) => {
        await updateMutation.mutateAsync({
          id,
          data: {
            name: String(values.name),
          },
        });
      }}
      onDelete={async (ids) => {
        await bulkDeleteMutation.mutateAsync(ids);
      }}
      createModalTitle="Create Menu Category"
      editModalTitle="Edit Menu Category"
    />
  );
};
