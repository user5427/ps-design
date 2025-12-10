import { Chip, Stack } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback } from "react";
import {
  RecordListView,
  type ViewFieldDefinition,
  type CustomFormModalProps,
} from "@/components/elements/record-list-view";
import {
  useCreateMenuItem,
  useBulkDeleteMenuItems,
  useMenuItems,
  useUpdateMenuItem,
} from "@/hooks/menu";
import { useMenuCategories } from "@/hooks/menu";
import { useProducts } from "@/hooks/inventory";
import type { MenuItem, CreateMenuItem, UpdateMenuItem } from "@/schemas/menu";
import { MenuItemFormModal } from "./menu-item-form-modal";

export const MenuItemsListView = () => {
  const { data: menuItems = [], isLoading, error, refetch } = useMenuItems();
  const { data: categories = [] } = useMenuCategories();
  const { data: products = [] } = useProducts();
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
          const prods = value as Array<{
            product: { name: string };
            quantity: number;
          }>;
          if (!prods?.length) return "-";
          return prods.map((p) => `${p.product.name} (${p.quantity})`).join(", ");
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

  const handleFormSubmit = useCallback(
    async (data: CreateMenuItem | { id: string; data: UpdateMenuItem }) => {
      if ("id" in data) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    },
    [createMutation, updateMutation]
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

  const renderCustomCreateModal = useCallback(
    (props: CustomFormModalProps<MenuItem>) => (
      <MenuItemFormModal
        open={props.open}
        onClose={props.onClose}
        mode="create"
        initialData={null}
        categories={categories}
        products={products}
        onSubmit={handleFormSubmit}
        onSuccess={props.onSuccess}
      />
    ),
    [categories, products, handleFormSubmit]
  );

  const renderCustomEditModal = useCallback(
    (props: CustomFormModalProps<MenuItem>) => (
      <MenuItemFormModal
        open={props.open}
        onClose={props.onClose}
        mode="edit"
        initialData={props.initialData}
        categories={categories}
        products={products}
        onSubmit={handleFormSubmit}
        onSuccess={props.onSuccess}
      />
    ),
    [categories, products, handleFormSubmit]
  );

  return (
    <RecordListView<MenuItem>
      title="Menu Items"
      columns={columns}
      data={menuItems}
      isLoading={isLoading}
      error={error}
      viewFields={viewFields}
      onDelete={handleDelete}
      onSuccess={handleSuccess}
      renderCustomCreateModal={renderCustomCreateModal}
      renderCustomEditModal={renderCustomEditModal}
      // need to pass onCreate/onEdit to enable these actions
      onCreate={async () => {}}
      onEdit={async () => {}}
    />
  );
};
