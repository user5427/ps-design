import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateMenuCategory,
  useBulkDeleteMenuCategories,
  useMenuCategories,
  useUpdateMenuCategory,
} from "@/hooks/menu";
import type { MenuItemCategory } from "@/schemas/menu";

export const MenuCategoriesListView = () => {
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useMenuCategories();
  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();
  const bulkDeleteMutation = useBulkDeleteMenuCategories();

  const columns = useMemo<MRT_ColumnDef<MenuItemCategory>[]>(
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

  const handleCreate = async (values: Partial<MenuItemCategory>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
  };

  const handleEdit = async (id: string, values: Partial<MenuItemCategory>) => {
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
    <RecordListView<MenuItemCategory>
      title="Menu Categories"
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
    />
  );
};
