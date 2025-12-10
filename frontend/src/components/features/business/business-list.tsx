import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useBusinessesPaginated,
  useDeleteBusiness,
  useCreateBusiness,
} from "@/queries/business";
import { apiClient } from "@/api/client";
import type { BusinessResponse } from "@ps-design/schemas/business";
import { useQueryClient } from "@tanstack/react-query";

export const BusinessList: React.FC = () => {
  const { data, isLoading, error, refetch } = useBusinessesPaginated(
    1,
    100,
    undefined,
  );
  const queryClient = useQueryClient();
  const createMutation = useCreateBusiness();
  const deleteMutation = useDeleteBusiness();

  const columns = useMemo<MRT_ColumnDef<BusinessResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "id",
        header: "ID",
        size: 200,
      },
    ],
    [],
  );

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

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<BusinessResponse>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
  };

  const handleEdit = useCallback(
    async (id: string, values: Partial<BusinessResponse>) => {
      await apiClient.put(`/business/${id}`, {
        name: String(values.name),
      });
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    [queryClient],
  );

  const handleDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const businessData = data?.items || [];

  return (
    <RecordListView<BusinessResponse>
      title="Businesses"
      columns={columns}
      data={businessData}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
    />
  );
};
