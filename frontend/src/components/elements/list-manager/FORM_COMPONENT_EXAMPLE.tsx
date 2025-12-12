/**
 * Example: Clean Form + ListManager Pattern
 * 
 * The key improvements:
 * 1. MessageManager is created once and passed everywhere
 * 2. FormBuilder has NO popup - just form logic
 * 3. UI wrapping happens at consuming level
 * 4. Forms can be reused anywhere (login, password change, lists, etc)
 */

import { useRef, useState } from "react";
import { createForm } from "../form-builder";
import { useMessageManager } from "@/components/elements/message-manager";
import { FormText, FormNumber } from "../form-builder/form-elements";
import { ListManager, type FormHandle, FormDialog } from ".";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";

// Shared form fields for create and edit
const ProductFormContent = ({ form }: { form: any }) => (
  <>
    <form.Field
      name="name"
      defaultValue=""
      validators={{
        onChange: ({ value }: any) => {
          if (!value || String(value).trim().length === 0) {
            return "Name is required";
          }
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormText
          fieldName="name"
          label="Product Name"
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
      name="price"
      defaultValue={0}
      validators={{
        onChange: ({ value }: any) => {
          if (!value || Number(value) <= 0) {
            return "Price must be greater than 0";
          }
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormNumber
          fieldName="price"
          label="Price"
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
  </>
);

/**
 * Main example component
 */
export function ProductListExample() {
  const messageManager = useMessageManager();

  // Create forms once
  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: ProductFormContent,
    messageManager,
    onSubmit: async (values: any) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to create product");
      messageManager.addMessage("Product created!", "success", 3000);
    },
  });

  const { ref: editFormRef, Component: EditFormComponent } = createForm({
    children: ProductFormContent,
    messageManager,
    onSubmit: async (values: any, record: any) => {
      if (!record?.id) throw new Error("No product ID");
      const response = await fetch(`/api/products/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to update product");
      messageManager.addMessage("Product updated!", "success", 3000);
    },
  });

  // State for dialog visibility
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Wrap the form ref's setVisible to manage dialog state
  const wrappedCreateFormRef = useRef<FormHandle>({
    setVisible: () => {},
    submit: async () => {},
  });
  const wrappedEditFormRef = useRef<FormHandle>({
    setVisible: () => {},
    submit: async () => {},
  });

  if (!wrappedCreateFormRef.current.submit || wrappedCreateFormRef.current.submit.toString().includes("() => {}")) {
    wrappedCreateFormRef.current = {
      setVisible: (visible: boolean, record?: any) => {
        setCreateOpen(visible);
        createFormRef.current?.setVisible(visible, record);
      },
      submit: async () => {
        await createFormRef.current?.submit();
      },
    };
  }

  if (!wrappedEditFormRef.current.submit || wrappedEditFormRef.current.submit.toString().includes("() => {}")) {
    wrappedEditFormRef.current = {
      setVisible: (visible: boolean, record?: any) => {
        setEditOpen(visible);
        editFormRef.current?.setVisible(visible, record);
      },
      submit: async () => {
        await editFormRef.current?.submit();
      },
    };
  }

  return (
    <>
      {/* List with CRUD buttons */}
      <ListManager
        mapping={PRODUCT_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedEditFormRef}
        messageManager={messageManager}
      />

      {/* Create Dialog - using FormDialog wrapper */}
      <FormDialog
        open={createOpen}
        title="Create Product"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => wrappedCreateFormRef.current?.setVisible(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      {/* Edit Dialog - using FormDialog wrapper */}
      <FormDialog
        open={editOpen}
        title="Edit Product"
        formRef={wrappedEditFormRef}
        submitLabel="Update"
        onClose={() => wrappedEditFormRef.current?.setVisible(false)}
      >
        <EditFormComponent />
      </FormDialog>
    </>
  );
}

/**
 * Benefits of this architecture:
 *
 * ✅ Single MessageManager instance - shared across all components
 * ✅ FormBuilder = ONLY form logic, NO UI wrapper
 * ✅ YOU control the Dialog/Drawer/Layout wrapping
 * ✅ Same form can be reused: list modal, login page, settings page, etc
 * ✅ messageManager.addMessage() shown by all forms and components
 *
 * The form goes from being tightly coupled to a modal dialog,
 * to being a reusable piece of form logic that you can put anywhere.
 *
 * **With FormDialog wrapper, it's super clean:**
 *
 * ```tsx
 * <FormDialog
 *   open={createOpen}
 *   title="Create Product"
 *   formRef={createForm.ref}
 *   submitLabel="Create"
 *   onClose={() => setCreateOpen(false)}
 * >
 *   <createForm.Component />
 * </FormDialog>
 * ```
 *
 * Use the form in different places:
 *
 *   // Login page - no modal, just the form
 *   <createForm.Component />
 *
 *   // List with FormDialog wrapper
 *   <FormDialog {...props}>
 *     <createForm.Component />
 *   </FormDialog>
 *
 *   // Drawer modal (create your own DrawerDialog component)
 *   <Drawer>
 *     <createForm.Component />
 *   </Drawer>
 *
 *   // Settings page - full width
 *   <Box sx={{ maxWidth: 600 }}>
 *     <createForm.Component />
 *   </Box>
 */
