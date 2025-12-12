import type React from "react";
import {
  useDeleteBusiness,
  useCreateBusiness,
  useUpdateBusiness,
} from "@/queries/business";
import { BUSINESS_MAPPING, BUSINESS_CONSTRAINTS } from "@ps-design/constants/business";
import { ListManager } from "@/components/elements/list-manager";
import { FormText } from "@/components/elements/form-builder";

// Define the form schema once, reuse for create and edit
const businessForm: (form: any) => React.ReactNode = (form) => (
  <form.Field
    name="name"
    defaultValue=""
    validators={{
      onChange: ({ value }: { value: unknown }) => {
        if (!value || String(value).trim().length === 0) {
          return "Name is required";
        }
        if (String(value).length > BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH) {
          return BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
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

export const BusinessList: React.FC = () => {
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();

  return (
    <ListManager
      mapping={BUSINESS_MAPPING}
      createForm={businessForm}
      editForm={businessForm}
      onCreate={async (values) => {
        await createMutation.mutateAsync({
          name: String(values.name),
        });
      }}
      onEdit={async (id, values) => {
        await updateMutation.mutateAsync({
          id,
          name: String(values.name),
        });
      }}
      onDelete={async (ids) => {
        await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
      }}
    />
  );
};
