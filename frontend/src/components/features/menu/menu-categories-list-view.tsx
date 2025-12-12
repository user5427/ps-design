import { useState, useRef } from "react";
import {
  useCreateMenuCategory,
  useUpdateMenuCategory,
} from "@/queries/menu";
import { MENU_ITEM_CATEGORY_MAPPING } from "@ps-design/constants/menu/category";
import { FormText } from "@/components/elements/form-builder";
import { ListManager, type FormHandle } from "@/components/elements/list-manager";
import { FormDialog } from "@/components/elements/form-decorator";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";

// Reusable form fields for create and edit
const MenuCategoryFormContent = ({ form }: { form: any }) => (
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
  const messageManager = useMessageManager();
  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();

  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: MenuCategoryFormContent,
    messageManager,
    onSubmit: async (values) => {
      try {
        await createMutation.mutateAsync({
          name: String(values.name),
        });
        messageManager.addMessage("Menu category created successfully", "success", 3000);
      } catch (error) {
        messageManager.addMessage("Failed to create menu category", "error", 3000);
      }
    },
  });

  const { ref: editFormRef, Component: EditFormComponent } = createForm({
    children: MenuCategoryFormContent,
    messageManager,
    onSubmit: async (values, record: any) => {
      if (!record?.id) return;
      try {
        await updateMutation.mutateAsync({
          id: String(record.id),
          data: {
            name: String(values.name),
          },
        });
        messageManager.addMessage("Menu category updated successfully", "success", 3000);
      } catch (error) {
        messageManager.addMessage("Failed to update menu category", "error", 3000);
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
        mapping={MENU_ITEM_CATEGORY_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedEditFormRef}
        messageManager={messageManager}
      />

      <FormDialog
        open={createOpen}
        title="Create Menu Category"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => setCreateOpen(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      <FormDialog
        open={editOpen}
        title="Edit Menu Category"
        formRef={wrappedEditFormRef}
        submitLabel="Update"
        onClose={() => setEditOpen(false)}
      >
        <EditFormComponent />
      </FormDialog>
    </>
  );
};
