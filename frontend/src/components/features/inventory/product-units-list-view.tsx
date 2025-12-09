import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useProductUnits,
  useUpdateProductUnit,
} from "@/hooks/inventory";
import type { ProductUnit } from "@/schemas/inventory";

export const ProductUnitsListView = () => {
  const { data: units = [], isLoading, error, refetch } = useProductUnits();
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  const columns = useMemo<MRT_ColumnDef<ProductUnit>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 150,
      },
      {
        accessorKey: "symbol",
        header: "Symbol",
        size: 100,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "-";
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
      name: "symbol",
      label: "Symbol",
      type: "text",
      placeholder: "e.g., kg, pcs, L",
      validationRules: [ValidationRules.maxLength(10)],
    },
  ];

  const editFormFields: FormFieldDefinition[] = createFormFields;

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "symbol", label: "Symbol" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<ProductUnit>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      symbol: values.symbol || undefined,
    });
  };

  const handleEdit = async (id: string, values: Partial<ProductUnit>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name: values.name,
        symbol: values.symbol || undefined,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <RecordListView<ProductUnit>
      title="Product Units"
      columns={columns}
      data={units}
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
