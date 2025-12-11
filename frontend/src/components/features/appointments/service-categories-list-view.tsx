import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateServiceCategory,
  useBulkDeleteServiceCategories,
  useServiceCategories,
  useUpdateServiceCategory,
} from "@/hooks/appointments";
import type { ServiceCategory } from "@/schemas/appointments";

export const ServiceCategoriesListView = () => {
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useServiceCategories();
  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory();
  const bulkDeleteMutation = useBulkDeleteServiceCategories();

  const columns = useMemo<MRT_ColumnDef<ServiceCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "";
        },
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

  const editFormFields: FormFieldDefinition[] = createFormFields;

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<ServiceCategory>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
  };

  const handleEdit = async (id: string, values: Partial<ServiceCategory>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name: values.name,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <RecordListView<ServiceCategory>
      title="Service Categories"
      columns={columns}
      data={categories}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Service Category"
      editModalTitle="Edit Service Category"
      viewModalTitle="View Service Category"
    />
  );
};
