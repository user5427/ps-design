import type React from "react";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useUpdateProductUnit,
} from "@/queries/inventory/product-unit";
import { PRODUCT_UNIT_MAPPING, PRODUCT_UNIT_CONSTRAINTS } from "@ps-design/constants/inventory/product-unit";
import { FormText } from "@/components/elements/form-builder";
import { ListManager } from "@/components/elements/list-manager";

// Define the form schema once
const productUnitForm: (form: any) => React.ReactNode = (form) => (
  <>
    <form.Field
      name="name"
      defaultValue=""
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (!value || String(value).trim().length === 0) {
            return "Name is required";
          }
          if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH) {
            return PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
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

    <form.Field
      name="symbol"
      defaultValue=""
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (value && String(value).trim().length > 0) {
            if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH) {
              return PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH_MESSAGE;
            }
          }
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormText
          fieldName="symbol"
          label="Symbol"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          type="text"
          placeholder="e.g., kg, pcs, L"
        />
      )}
    </form.Field>
  </>
);

export const ProductUnitsListView = () => {
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  return (
    <ListManager
      mapping={PRODUCT_UNIT_MAPPING}
      createForm={productUnitForm}
      editForm={productUnitForm}
      onCreate={async (values) => {
        await createMutation.mutateAsync({
          name: String(values.name),
          symbol: values.symbol ? String(values.symbol) : undefined,
        });
      }}
      onEdit={async (id, values) => {
        await updateMutation.mutateAsync({
          id,
          name: String(values.name),
          symbol: values.symbol ? String(values.symbol) : undefined,
        });
      }}
      onDelete={async (ids) => {
        await bulkDeleteMutation.mutateAsync(ids);
      }}
      createModalTitle="Create Product Unit"
      editModalTitle="Edit Product Unit"
    />
  );
};
