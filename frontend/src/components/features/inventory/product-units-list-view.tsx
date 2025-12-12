import { useState, useRef } from "react";
import {
  useCreateProductUnit,
  useUpdateProductUnit,
} from "@/queries/inventory/product-unit";
import { PRODUCT_UNIT_MAPPING, PRODUCT_UNIT_CONSTRAINTS } from "@ps-design/constants/inventory/product-unit";
import { FormText } from "@/components/elements/form-builder";
import { ListManager, type FormHandle } from "@/components/elements/list-manager";
import { FormDialog } from "@/components/elements/form-decorator";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";

// Reusable form fields for create and edit
const ProductUnitFormContent = ({ form }: { form: any }) => (
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
  const messageManager = useMessageManager();
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();

  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: ProductUnitFormContent,
    messageManager,
    onSubmit: async (values) => {
      try {
        await createMutation.mutateAsync({
          name: String(values.name),
          symbol: values.symbol ? String(values.symbol) : undefined,
        });
        messageManager.addMessage("Product unit created successfully", "success", 3000);
      } catch (error) {
        messageManager.addMessage("Failed to create product unit", "error", 3000);
      }
    },
  });

  const { ref: editFormRef, Component: EditFormComponent } = createForm({
    children: ProductUnitFormContent,
    messageManager,
    onSubmit: async (values, record: any) => {
      if (!record?.id) return;
      try {
        await updateMutation.mutateAsync({
          id: String(record.id),
          name: String(values.name),
          symbol: values.symbol ? String(values.symbol) : undefined,
        });
        messageManager.addMessage("Product unit updated successfully", "success", 3000);
      } catch (error) {
        messageManager.addMessage("Failed to update product unit", "error", 3000);
      }
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Wrapper refs to manage dialog visibility alongside form visibility
  const wrappedCreateFormRef = useRef<FormHandle>({
    setVisible: (visible, record?) => {
      setCreateOpen(visible);
      createFormRef.current?.setVisible(visible, record);
    },
    submit: async () => await createFormRef.current?.submit(),
  });

  const wrappedEditFormRef = useRef<FormHandle>({
    setVisible: (visible, record?) => {
      setEditOpen(visible);
      editFormRef.current?.setVisible(visible, record);
    },
    submit: async () => await editFormRef.current?.submit(),
  });

  return (
    <>
      <ListManager
        mapping={PRODUCT_UNIT_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedEditFormRef}
        messageManager={messageManager}
      />

      <FormDialog
        open={createOpen}
        title="Create Product Unit"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => setCreateOpen(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      <FormDialog
        open={editOpen}
        title="Edit Product Unit"
        formRef={wrappedEditFormRef}
        submitLabel="Update"
        onClose={() => setEditOpen(false)}
      >
        <EditFormComponent />
      </FormDialog>
    </>
  );
};
