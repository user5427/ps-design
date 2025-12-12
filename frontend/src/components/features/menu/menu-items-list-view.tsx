import { Stack } from "@mui/material";
import { useMemo, useCallback } from "react";
import {
  RecordListView,
  type ViewFieldDefinition,
  type CustomFormModalProps,
} from "@/components/elements/record-list-view";
import {
  useCreateMenuItem,
  useBulkDeleteMenuItems,
  useUpdateMenuItem,
} from "@/queries/menu";
import { usePaginatedQuery } from "@/queries/pagination";
import { MENU_ITEM_MAPPING } from "@ps-design/constants/menu/items";
import type {
  MenuItemResponse as MenuItem,
  CreateMenuItemBody,
  UpdateMenuItemBody,
} from "@ps-design/schemas/menu/items";
import { MenuItemFormModal } from "./menu-item-form-modal";

export const MenuItemsListView = () => {
  const { items: _menuItems = [], refetch } = usePaginatedQuery(MENU_ITEM_MAPPING);
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const bulkDeleteMutation = useBulkDeleteMenuItems();

  const viewFields: ViewFieldDefinition[] = useMemo(
    () => [
      { name: "id", label: "ID" },
      { name: "baseName", label: "Name" },
      {
        name: "basePrice",
        label: "Base Price",
        render: (value) => `${(value as number).toFixed(2)}€`,
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
            product: {
              name: string;
              productUnit: { name: string; symbol: string | null };
            };
            quantity: number;
          }>;
          if (!prods?.length) return "-";
          return prods
            .map((p) => {
              const unit =
                p.product.productUnit.symbol || p.product.productUnit.name;
              return `${p.product.name} (${p.quantity} ${unit})`;
            })
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
            isDisabled: boolean;
            isAvailable: boolean;
            addonProducts: Array<{
              product: {
                name: string;
                productUnit: { name: string; symbol: string | null };
              };
              quantity: number;
            }>;
          }>;
          if (!variations?.length) return "-";
          return (
            <Stack spacing={0.5}>
              {variations.map((v, index) => {
                const addonText =
                  v.addonProducts?.length > 0
                    ? ` [${v.addonProducts
                        .map((ap) => {
                          const unit =
                            ap.product.productUnit.symbol ||
                            ap.product.productUnit.name;
                          return `${ap.product.name} (${ap.quantity} ${unit})`;
                        })
                        .join(", ")}]`
                    : "";
                const statusText = v.isDisabled
                  ? " (Disabled)"
                  : v.isAvailable
                    ? " (Available)"
                    : " (Unavailable)";
                return (
                  <div key={`${v.name}-${v.type}-${index}`}>
                    {`${v.name} (${v.type}) ${v.priceAdjustment >= 0 ? "+" : ""} ${v.priceAdjustment.toFixed(2)}€${addonText}${statusText}`}
                  </div>
                );
              })}
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
    [],
  );

  const handleFormSubmit = useCallback(
    async (data: CreateMenuItemBody | { id: string; data: UpdateMenuItemBody }) => {
      if ("id" in data) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      await refetch();
    },
    [createMutation, updateMutation, refetch],
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      await bulkDeleteMutation.mutateAsync(ids);
      await refetch();
    },
    [bulkDeleteMutation, refetch],
  );

  const renderCustomCreateModal = useCallback(
    (props: CustomFormModalProps<MenuItem>) => (
      <MenuItemFormModal
        open={props.open}
        onClose={props.onClose}
        mode="create"
        initialData={null}
        categories={[]}
        products={[]}
        onSubmit={handleFormSubmit}
        onSuccess={async () => {
          props.onSuccess();
          await refetch();
        }}
      />
    ),
    [handleFormSubmit, refetch],
  );

  const renderCustomEditModal = useCallback(
    (props: CustomFormModalProps<MenuItem>) => (
      <MenuItemFormModal
        open={props.open}
        onClose={props.onClose}
        mode="edit"
        initialData={props.initialData}
        categories={[]}
        products={[]}
        onSubmit={handleFormSubmit}
        onSuccess={async () => {
          props.onSuccess();
          await refetch();
        }}
      />
    ),
    [handleFormSubmit, refetch],
  );

  return (
    <RecordListView<MenuItem>
      mapping={MENU_ITEM_MAPPING}
      viewFields={viewFields}
      onDelete={handleDelete}
      renderCustomCreateModal={renderCustomCreateModal}
      renderCustomEditModal={renderCustomEditModal}
      // These are needed to enable create/edit actions
      onCreate={async () => {}}
      onEdit={async () => {}}
      viewModalTitle="View Menu Item"
    />
  );
};
