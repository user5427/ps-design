import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
} from "@mui/material";
import { useCreateStockChange } from "@/queries/inventory/stock-change";
import { SmartPaginationList } from "@/components/elements/pagination";
import { STOCK_CHANGE_MAPPING } from "@ps-design/constants/inventory/stock-change";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";
import { FormNumber, FormSelect } from "@/components/elements/form-builder";
import { ListManager, type FormHandle } from "@/components/elements/list-manager";
import { FormDialog } from "@/components/elements/form-decorator";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";

const typeOptions = [
  { value: "SUPPLY", label: "Supply" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "WASTE", label: "Waste" },
];

export const StockChangesListView = () => {
  const messageManager = useMessageManager();
  const createMutation = useCreateStockChange();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductLabel, setSelectedProductLabel] = useState<string>("");
  const [productSelectOpen, setProductSelectOpen] = useState(false);

  // Reusable form fields for create
  const StockChangeFormContent = ({ form }: { form: any }) => (
    <>
      <form.Field
        name="type"
        defaultValue=""
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (!value || String(value).trim().length === 0) {
              return "Type is required";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormSelect
            fieldName="type"
            label="Type"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0] || ""}
            type="select"
            required
            options={typeOptions}
          />
        )}
      </form.Field>

      <form.Field
        name="quantity"
        defaultValue={0}
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (value === 0 || !value) return "Quantity is required";
            if (Number(value) <= 0) return "Quantity must be greater than 0";
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormNumber
            fieldName="quantity"
            label="Quantity"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0] || ""}
            type="number"
            required
          />
        )}
      </form.Field>

      <Button
        variant="outlined"
        onClick={() => setProductSelectOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
      >
        Select Product {selectedProductLabel && `(${selectedProductLabel})`}
      </Button>
    </>
  );

  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: StockChangeFormContent,
    messageManager,
    onSubmit: async (values) => {
      if (!selectedProductId) {
        messageManager.addMessage("Please select a product", "error", 3000);
        return;
      }
      try {
        await createMutation.mutateAsync({
          productId: selectedProductId,
          type: String(values.type) as "SUPPLY" | "ADJUSTMENT" | "WASTE",
          quantity: Number(values.quantity),
          expirationDate: values.expirationDate ? String(values.expirationDate) : undefined,
        });
        messageManager.addMessage("Stock change created successfully", "success", 3000);
        setSelectedProductId(null);
        setSelectedProductLabel("");
      } catch (error) {
        messageManager.addMessage("Failed to create stock change", "error", 3000);
      }
    },
  });

  const [createOpen, setCreateOpen] = useState(false);

  // Wrapper refs to manage dialog visibility alongside form visibility
  const wrappedCreateFormRef = useRef<FormHandle>({
    setVisible: (visible, record?) => {
      setCreateOpen(visible);
      createFormRef.current?.setVisible(visible, record);
    },
    submit: async () => await createFormRef.current?.submit(),
  });

  const handleSelectProduct = (rowData: Record<string, unknown>) => {
    const productData = rowData as any;
    setSelectedProductId(productData.id);
    setSelectedProductLabel(productData.name);
    setProductSelectOpen(false);
  };

  return (
    <>
      <ListManager
        mapping={STOCK_CHANGE_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedCreateFormRef}
        messageManager={messageManager}
      />

      <FormDialog
        open={createOpen}
        title="Create Stock Change"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => setCreateOpen(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      <Dialog
        open={productSelectOpen}
        onClose={() => setProductSelectOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Product</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box sx={{ mt: 2 }}>
            <SmartPaginationList
              mapping={PRODUCT_MAPPING}
              onSelect={handleSelectProduct}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
