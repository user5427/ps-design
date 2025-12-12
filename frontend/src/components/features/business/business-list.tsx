import { useState, useRef } from "react";
import {
  useCreateBusiness,
  useUpdateBusiness,
} from "@/queries/business";
import { BUSINESS_MAPPING, BUSINESS_CONSTRAINTS } from "@ps-design/constants/business";
import { ListManager, type FormHandle } from "@/components/elements/list-manager";
import { FormDialog } from "@/components/elements/form-decorator";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";
import { FormText } from "@/components/elements/form-builder";

// Reusable form fields for create and edit
const BusinessFormContent = ({ form }: { form: any }) => (
  <form.Field
    name="name"
    defaultValue=""
    validators={{
      onChange: ({ value }: any) => {
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
  const messageManager = useMessageManager();
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Create forms using createForm()
  const { ref: createFormRef, Component: CreateFormComponent } = createForm({
    children: BusinessFormContent,
    messageManager,
    onSubmit: async (values: any) => {
      await createMutation.mutateAsync({
        name: String(values.name),
      });
      messageManager.addMessage("Business created successfully", "success", 3000);
    },
  });

  const { ref: editFormRef, Component: EditFormComponent } = createForm({
    children: BusinessFormContent,
    messageManager,
    onSubmit: async (values: any, record: any) => {
      if (!record?.id) throw new Error("No business ID");
      await updateMutation.mutateAsync({
        id: record.id,
        name: String(values.name),
      });
      messageManager.addMessage("Business updated successfully", "success", 3000);
    },
  });

  // Wrap form refs to manage dialog visibility
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
      <ListManager
        mapping={BUSINESS_MAPPING}
        createFormRef={wrappedCreateFormRef}
        editFormRef={wrappedEditFormRef}
        messageManager={messageManager}
      />

      <FormDialog
        open={createOpen}
        title="Create Business"
        formRef={wrappedCreateFormRef}
        submitLabel="Create"
        onClose={() => wrappedCreateFormRef.current?.setVisible(false)}
      >
        <CreateFormComponent />
      </FormDialog>

      <FormDialog
        open={editOpen}
        title="Edit Business"
        formRef={wrappedEditFormRef}
        submitLabel="Update"
        onClose={() => wrappedEditFormRef.current?.setVisible(false)}
      >
        <EditFormComponent />
      </FormDialog>
    </>
  );
};
