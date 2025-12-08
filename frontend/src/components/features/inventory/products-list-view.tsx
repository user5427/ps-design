import { Chip } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateProduct,
  useDeleteProduct,
  useProductUnits,
  useProducts,
  useUpdateProduct,
} from "@/hooks/inventory";
import type { Product } from "@/schemas/inventory";

export const ProductsListView = () => {
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const { data: units = [] } = useProductUnits();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const columns = useMemo<MRT_ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 150,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 250,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "productUnit.name",
        header: "Unit",
        size: 120,
        Cell: ({ row }) =>
          row.original.productUnit?.name ||
          row.original.productUnitId.slice(0, 8),
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 150,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? "Disabled" : "Active"}
            color={cell.getValue<boolean>() ? "default" : "success"}
            size="small"
          />
        ),
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
    []
  );

  const unitOptions = useMemo(
    () =>
      units.map((unit) => ({
        value: unit.id,
        label: unit.name + (unit.symbol ? ` (${unit.symbol})` : ""),
      })),
    [units]
  );

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [ValidationRules.minLength(1), ValidationRules.maxLength(100)],
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "productUnitId",
      label: "Unit",
      type: "select",
      required: true,
      options: unitOptions,
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    ...createFormFields,
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
    },
  ];

  const handleCreate = async (values: Partial<Product>) => {
    await createMutation.mutateAsync({
      name: values.name!,
      description: values.description || undefined,
      productUnitId: values.productUnitId!,
    });
  };

  const handleEdit = async (id: string, values: Partial<Product>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name: values.name,
        description: values.description || undefined,
        productUnitId: values.productUnitId,
        isDisabled: values.isDisabled,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
  };

  return (
    <RecordListView<Product>
      title="Products"
      columns={columns}
      data={products}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
    />
  );
};
