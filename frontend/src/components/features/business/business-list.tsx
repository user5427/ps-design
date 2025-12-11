import { useState } from "react";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import type { FormFieldDefinition } from "@/components/elements/form";
import { FormModal, ValidationRules } from "@/components/elements/form";
import {
  useBusinessesPaginated,
  useDeleteBusiness,
  useCreateBusiness,
} from "@/queries/business";
import { apiClient } from "@/api/client";
import type { BusinessResponse } from "@ps-design/schemas/business";
import { useQueryClient } from "@tanstack/react-query";

export const BusinessList: React.FC = () => {
  const { data, refetch } = useBusinessesPaginated(
    1,
    100,
    undefined,
  );
  const queryClient = useQueryClient();
  const createMutation = useCreateBusiness();
  const deleteMutation = useDeleteBusiness();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: BusinessResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(100),
      ],
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(100),
      ],
    },
  ];

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await apiClient.put(`/business/${formState.data?.id}`, {
      name: String(values.name),
    });
    queryClient.invalidateQueries({ queryKey: ["business"] });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEdit = (rowData: BusinessResponse) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData,
    });
  };

  const handleDelete = async (rowData: BusinessResponse) => {
    await deleteMutation.mutateAsync(rowData.id);
    refetch();
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  const businessData = data?.items || [];

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", gap: 1 }}>
        {businessData.map((item) => (
          <Box key={item.id} sx={{ p: 2, border: "1px solid #ddd" }}>
            <div>{item.name}</div>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button size="small" onClick={() => handleEdit(item)}>
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(item)}
              >
                Delete
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title="Create Business"
        fields={createFormFields}
        onSubmit={handleCreateSubmit}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title="Edit Business"
        fields={editFormFields}
        initialValues={formState.data}
        onSubmit={handleEditSubmit}
      />
    </Stack>
  );
};