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

interface User {
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
}

interface Business {
  id: string;
  name: string;
}

export function AdminUsersManagement() {
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading: usersLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get("/users");
      return response.data;
    },
  });

  // Fetch all businesses for display mapping
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: async () => {
      const response = await apiClient.get("/business");
      return response.data.data;
    },
  });

  // Create business name lookup
  const businessLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    businesses.forEach((b) => {
      lookup[b.id] = b.name;
    });
    return lookup;
  }, [businesses]);

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
        accessorKey: "businessId",
        header: "Business",
        size: 200,
        Cell: ({ cell }) => {
          const businessId = cell.getValue() as string | null;
          if (!businessId) return "No business";
          return businessLookup[businessId] || businessId;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 150,
        Cell: ({ cell }) => new Date(cell.getValue() as string).toLocaleDateString(),
      },
    ],
    [businessLookup],
  );

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
    for (const id of ids) {
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
      editFormFields={editFormFields}
      viewFields={viewFields}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={refetch}
      editModalTitle="Edit User"
      viewModalTitle="View User"
      enableCreate={false}
    />
  );
}
