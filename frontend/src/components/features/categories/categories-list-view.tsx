import { useMemo } from "react";
import type { MRT_ColumnDef } from "material-react-table";
import { Select, MenuItem } from "@mui/material";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useBulkDeleteCategories,
  useAssignTaxToCategory,
  useRemoveTaxFromCategory,
} from "@/hooks/category-hooks";
import { useTaxes } from "@/hooks/tax";
import type { Category } from "@/schemas/category";
import type { TaxResponse } from "@ps-design/schemas/tax";

export const CategoriesListView = () => {
  const { data: categories = [], isLoading, error, refetch } = useCategories();
  const { data: taxes = [] } = useTaxes();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const bulkDeleteMutation = useBulkDeleteCategories();
  const assignTaxMutation = useAssignTaxToCategory();
  const removeTaxMutation = useRemoveTaxFromCategory();

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "taxId",
        header: "Tax",
        size: 200,
        Cell: ({ row }) => {
          const category = row.original;
          return (
            <Select
              size="small"
              value={category.taxId ?? ""}
              displayEmpty
              onChange={async (e) => {
                const taxId = e.target.value || null;
                if (taxId) {
                  await assignTaxMutation.mutateAsync({
                    categoryId: category.id,
                    taxId,
                  });
                } else {
                  await removeTaxMutation.mutateAsync(category.id);
                }
                await refetch();
              }}
            >
              <MenuItem value="">No Tax</MenuItem>
              {taxes.map((tax: TaxResponse) => (
                <MenuItem key={tax.id} value={tax.id}>
                  {tax.name} ({tax.rate}%)
                </MenuItem>
              ))}
            </Select>
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
    [taxes, assignTaxMutation, removeTaxMutation, refetch],
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
    {
      name: "taxId",
      label: "Tax",
      render: (taxId) => {
        if (!taxId) return "No Tax";
        const tax = taxes.find((t) => t.id === taxId);
        return tax ? `${tax.name} (${tax.rate}%)` : "Unknown Tax";
      },
    },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<Category>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
    await refetch(); // immediately refresh the table
  };

  const handleEdit = async (id: string, values: Partial<Category>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name: values.name,
      },
    });
    await refetch(); // refresh table to sync changes
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
    await refetch();
  };

  return (
    <RecordListView<Category>
      title="Categories"
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
      createModalTitle="Create Category"
      editModalTitle="Edit Category"
      viewModalTitle="View Category"
    />
  );
};
