import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
} from "@mui/material";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { SmartPaginationList } from "@/components/elements/pagination";
import { PRODUCT_MAPPING, PRODUCT_CONSTRAINTS } from "@ps-design/constants/inventory/product";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import { FormText, FormTextarea } from "@/components/elements/form-builder";
import { ListManager, type FormHandle } from "@/components/elements/list-manager";
import { FormDialog } from "@/components/elements/form-decorator";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";

export const ProductsListView = () => {
  const messageManager = useMessageManager();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>("");
  const [unitSelectOpen, setUnitSelectOpen] = useState(false);

  // Reusable form fields for create and edit
  const ProductFormContent = ({ form }: { form: any }) => (
    <>
      <form.Field
        name="name"
        defaultValue=""
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (!value || String(value).trim().length === 0) {
              return "Name is required";
            }
            if (String(value).length > PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH) {
              return PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
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
        name="description"
        defaultValue=""
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (value && String(value).length > PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
              return PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH_MESSAGE;
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormTextarea
            fieldName="description"
            label="Description"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0] || ""}
            type="textarea"
            rows={3}
          />
        )}
      </form.Field>

      <Button
        variant="outlined"
        onClick={() => setUnitSelectOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
      >
        Select Unit {selectedUnitLabel && `(${selectedUnitLabel})`}
      </Button>
    </>
  );

  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: ProductFormContent,
    messageManager,
    onSubmit: async (values) => {
      if (!selectedUnitId) {
        messageManager.addMessage("Please select a unit", "error", 3000);
        return;
      }
      try {
        await createMutation.mutateAsync({
          name: String(values.name),
          description: values.description ? String(values.description) : undefined,
          productUnitId: selectedUnitId,
        });
        messageManager.addMessage("Product created successfully", "success", 3000);
        setSelectedUnitId(null);
        setSelectedUnitLabel("");
      } catch (error) {
        messageManager.addMessage("Failed to create product", "error", 3000);
      }
    },
  });

  const { ref: editFormRef, Component: EditFormComponent } = createForm({
    children: ProductFormContent,
    messageManager,
    onSubmit: async (values, record: any) => {
      if (!record?.id) return;
      try {
        await updateMutation.mutateAsync({
          id: String(record.id),
          name: values.name ? String(values.name) : undefined,
          description: values.description ? String(values.description) : undefined,
          productUnitId: selectedUnitId || undefined,
        });
        messageManager.addMessage("Product updated successfully", "success", 3000);
        setSelectedUnitId(null);
        setSelectedUnitLabel("");
      } catch (error) {
        messageManager.addMessage("Failed to update product", "error", 3000);
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

  const handleSelectUnit = (rowData: Record<string, unknown>) => {
    const unitData = rowData as any;
    const newUnitLabel = unitData.name + (unitData.symbol ? ` (${unitData.symbol})` : "");
    setSelectedUnitId(unitData.id);
    setSelectedUnitLabel(newUnitLabel);
    setUnitSelectOpen(false);
  };

  return (
    <>
      <ListManager
        mapping={PRODUCT_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedEditFormRef}
        messageManager={messageManager}
      />

      <FormDialog
        open={createOpen}
        title="Create Product"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => setCreateOpen(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      <FormDialog
        open={editOpen}
        title="Edit Product"
        formRef={wrappedEditFormRef}
        submitLabel="Update"
        onClose={() => setEditOpen(false)}
      >
        <EditFormComponent />
      </FormDialog>

      <Dialog
        open={unitSelectOpen}
        onClose={() => setUnitSelectOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Product Unit</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box sx={{ mt: 2 }}>
            <SmartPaginationList
              mapping={PRODUCT_UNIT_MAPPING}
              onSelect={handleSelectUnit}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
