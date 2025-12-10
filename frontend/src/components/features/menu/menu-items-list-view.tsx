import { Chip, Stack } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateMenuItem,
  useBulkDeleteMenuItems,
  useMenuItems,
  useUpdateMenuItem,
} from "@/hooks/menu";
import { useMenuCategories } from "@/hooks/menu";
import type { MenuItem } from "@/schemas/menu";

export const MenuItemsListView = () => {
  const { data: menuItems = [], isLoading, error, refetch } = useMenuItems();
  const { data: categories = [] } = useMenuCategories();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const bulkDeleteMutation = useBulkDeleteMenuItems();

  const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
    () => [
      {
        accessorKey: "baseName",
        header: "Name",
        size: 180,
      },
      {
        accessorKey: "basePrice",
        header: "Base Price",
        size: 100,
        Cell: ({ cell }) => `$${cell.getValue<number>().toFixed(2)}`,
      },
      {
        accessorKey: "category.name",
        header: "Category",
        size: 150,
        Cell: ({ row }) => row.original.category?.name || "",
      },
      {
        accessorKey: "isAvailable",
        header: "Available",
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? "Yes" : "No"}
            color={cell.getValue<boolean>() ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? "Disabled" : "Active"}
            color={cell.getValue<boolean>() ? "default" : "success"}
            size="small"
          />
        ),
      },
    ],
    []
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "No Category" },
      ...categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    ],
    [categories]
  );

  const createFormFields: FormFieldDefinition[] = useMemo(
    () => [
      {
        name: "baseName",
        label: "Name",
        type: "text",
        required: true,
        validationRules: [
          ValidationRules.minLength(1),
          ValidationRules.maxLength(100),
        ],
      },
      {
        name: "basePrice",
        label: "Base Price",
        type: "number",
        required: true,
        validationRules: [ValidationRules.min(0)],
      },
      {
        name: "categoryId",
        label: "Category",
        type: "autocomplete",
        options: categoryOptions,
        placeholder: "Select category...",
      },
    ],
    [categoryOptions]
  );

  const editFormFields: FormFieldDefinition[] = useMemo(
    () => [
      ...createFormFields,
      {
        name: "isDisabled",
        label: "Disabled",
        type: "checkbox",
      },
    ],
    [createFormFields]
  );

  const viewFields: ViewFieldDefinition[] = useMemo(
    () => [
      { name: "id", label: "ID" },
      { name: "baseName", label: "Name" },
      {
        name: "basePrice",
        label: "Base Price",
        render: (value) => `$${(value as number).toFixed(2)}`,
      },
      {
        name: "category",
        label: "Category",
        render: (value) => {
          const cat = value as { name: string } | null;
          return cat?.name || "-";
        },
      },
      {
        name: "baseProducts",
        label: "Base Products",
        render: (value) => {
          const products = value as Array<{
            product: { name: string };
            quantity: number;
          }>;
          if (!products?.length) return "-";
          return products
            .map((p) => `${p.product.name} (${p.quantity})`)
            .join(", ");
        },
      },
      {
        name: "variations",
        label: "Variations",
        render: (value) => {
          const variations = value as Array<{
            name: string;
            type: string;
            priceAdjustment: number;
          }>;
          if (!variations?.length) return "-";
          return (
            <Stack spacing={0.5}>
              {variations.map((v, i) => (
                <Chip
                  key={i}
                  label={`${v.name} (${v.type}) ${v.priceAdjustment >= 0 ? "+" : ""}$${v.priceAdjustment.toFixed(2)}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          );
        },
      },
      {
        name: "isAvailable",
        label: "Available",
        render: (value) => (value ? "Yes" : "No"),
      },
      {
        name: "isDisabled",
        label: "Disabled",
        render: (value) => (value ? "Yes" : "No"),
      },
      { name: "createdAt", label: "Created At" },
      { name: "updatedAt", label: "Updated At" },
    ],
    []
  );

  const handleCreate = useCallback(
    async (values: Partial<MenuItem>) => {
      await createMutation.mutateAsync({
        baseName: String(values.baseName),
        basePrice: Number(values.basePrice),
        categoryId: values.categoryId || null,
        isDisabled: false,
        baseProducts: [],
        variations: [],
      });
    },
    [createMutation]
  );

  const handleEdit = useCallback(
    async (id: string, values: Partial<MenuItem>) => {
      await updateMutation.mutateAsync({
        id,
        data: {
          baseName: values.baseName,
          basePrice:
            values.basePrice !== undefined
              ? Number(values.basePrice)
              : undefined,
          categoryId: values.categoryId,
          isDisabled: values.isDisabled,
        },
      });
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      await bulkDeleteMutation.mutateAsync(ids);
    },
    [bulkDeleteMutation]
  );

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <RecordListView<MenuItem>
      title="Menu Items"
      columns={columns}
      data={menuItems}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={handleSuccess}
    />
  );
};
