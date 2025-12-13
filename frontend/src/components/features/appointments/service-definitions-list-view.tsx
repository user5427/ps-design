import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateServiceDefinition,
  useBulkDeleteServiceDefinitions,
  useServiceDefinitions,
  useUpdateServiceDefinition,
} from "@/hooks/appointments";
import { useCategories } from "@/hooks/category-hooks";
import type { ServiceDefinition } from "@/schemas/appointments";
import { Chip } from "@mui/material";
import { formatPrice, centsToEuros, eurosToCents } from "@/utils/price";
import type { CategoryResponse } from "@ps-design/schemas/category";

export const ServiceDefinitionsListView = () => {
  const {
    data: definitions = [],
    isLoading,
    error,
    refetch,
  } = useServiceDefinitions();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateServiceDefinition();
  const updateMutation = useUpdateServiceDefinition();
  const bulkDeleteMutation = useBulkDeleteServiceDefinitions();

  const categoryOptions = useMemo(
    () =>
      categories.map((cat: CategoryResponse) => ({
        label: cat.name,
        value: cat.id,
      })),
    [categories],
  );

  const columns = useMemo<MRT_ColumnDef<ServiceDefinition>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 250,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | null>();
          return value?.slice(0, 100) || "";
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 120,
        Cell: ({ row }) => {
          const category = row.original.category;
          return category ? category.name : "";
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        size: 100,
        Cell: ({ cell }) => formatPrice(cell.getValue<number>()),
      },
      {
        accessorKey: "duration",
        header: "Duration (min)",
        size: 100,
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => {
          const isDisabled = cell.getValue<boolean>();
          return (
            <Chip
              label={isDisabled ? "Disabled" : "Active"}
              color={isDisabled ? "default" : "success"}
              size="small"
            />
          );
        },
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
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
      validationRules: [ValidationRules.maxLength(1000)],
    },
    {
      name: "price",
      label: "Price (€)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(0)],
      transformForEdit: (value) => centsToEuros(value as number),
      transformForSubmit: (value) => eurosToCents(value as number),
    },
    {
      name: "duration",
      label: "Duration (minutes)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(1), ValidationRules.max(480)],
    },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      required: false,
      options: categoryOptions,
    },
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
      required: false,
      defaultValue: false,
    },
  ];

  const editFormFields: FormFieldDefinition[] = createFormFields;

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    {
      name: "price",
      label: "Price",
      render: (value) => formatPrice(value as number),
    },
    {
      name: "duration",
      label: "Duration",
      render: (value) => `${value} minutes`,
    },
    { name: "category.name", label: "Category" },
    { name: "isDisabled", label: "Disabled" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<ServiceDefinition>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      description: values.description || null,
      price: Number(values.price) || 0,
      duration: Number(values.duration) || 30,
      categoryId: (values as { categoryId?: string }).categoryId || null,
      isDisabled: values.isDisabled || false,
    });
  };

  const handleEdit = async (id: string, values: Partial<ServiceDefinition>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name: values.name,
        description: values.description,
        price: values.price !== undefined ? Number(values.price) : undefined,
        duration:
          values.duration !== undefined ? Number(values.duration) : undefined,
        categoryId: (values as { categoryId?: string }).categoryId,
        isDisabled: values.isDisabled,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <RecordListView<ServiceDefinition>
      title="Service Definitions"
      columns={columns}
      data={definitions}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Service Definition"
      editModalTitle="Edit Service Definition"
      viewModalTitle="View Service Definition"
    />
  );
};
