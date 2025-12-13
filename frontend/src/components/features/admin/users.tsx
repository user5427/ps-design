import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import { apiClient } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/auth";
import { TextField, Box } from "@mui/material";
import { PasswordStrengthIndicator } from "@/components/elements/auth/password-strength-indicator";
import { checkPasswordStrength } from "@/utils/auth";

type User = Record<string, unknown> & {
  id: string;
  email: string;
  name: string;
  businessId: string | null;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function AdminUsersManagement() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useAuthUser();

  // Fetch all users in the system
  const { data: users = [], isLoading: usersLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get("/users");
      return response.data;
    },
  });

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 250,
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 150,
        Cell: ({ cell }) => new Date(cell.getValue() as string).toLocaleDateString(),
      },
    ],
    [],
  );

  // Fetch all businesses for the selector
  const { data: businesses = [] } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const response = await apiClient.get("/business", {
        params: { page: 1, limit: 100 },
      });
      return response.data.items;
    },
  });

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [ValidationRules.minLength(1)],
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      validationRules: [ValidationRules.email()],
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      validationRules: [
        ValidationRules.minLength(8),
        {
          test: (value) => {
            const strength = checkPasswordStrength(String(value || ""));
            return strength.isValid;
          },
          message: "Password does not meet requirements",
        },
      ],
      renderCustomField: ({ value, onChange, error, disabled }) => {
        const passwordValue = String(value || "");
        const strength = checkPasswordStrength(passwordValue);
        
        return (
          <Box>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={passwordValue}
              onChange={(e) => onChange(e.target.value)}
              error={!!error}
              helperText={error}
              disabled={disabled}
              required
            />
            {passwordValue.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <PasswordStrengthIndicator
                  score={strength.score}
                  feedback={strength.feedback}
                />
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      name: "businessId",
      label: "Business",
      type: "select",
      required: true,
      options: businesses.map((b: { id: string; name: string }) => ({ value: b.id, label: b.name })),
    },
    {
      name: "isOwner",
      label: "Make user owner of business",
      type: "checkbox",
      required: false,
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [ValidationRules.minLength(1)],
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      validationRules: [ValidationRules.email()],
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "email", label: "Email" },
    { name: "businessId", label: "Business ID" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = useCallback(
    async (values: Partial<User>) => {
      await apiClient.post("/users", {
        name: values.name,
        email: values.email,
        password: values.password,
        businessId: values.businessId,
        isOwner: values.isOwner || false,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    [queryClient],
  );

  const handleEdit = useCallback(
    async (id: string, values: Partial<User>) => {
      await apiClient.put(`/users/${id}`, {
        name: values.name,
        email: values.email,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    [queryClient],
  );

  const handleDelete = async (ids: string[]) => {
    // Prevent deleting yourself
    const canDelete = ids.filter((id) => id !== currentUser?.id);
    
    if (canDelete.length === 0) {
      throw new Error("You cannot delete your own account");
    }

    for (const id of canDelete) {
      await apiClient.delete(`/users/${id}`);
    }
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <RecordListView<User>
      title="Users"
      columns={columns}
      data={users}
      isLoading={usersLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={refetch}
      createModalTitle="Create User"
      editModalTitle="Edit User"
      viewModalTitle="View User"
    />
  );
}
