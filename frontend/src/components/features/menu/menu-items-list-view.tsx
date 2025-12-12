import { Stack } from "@mui/material";
import { useMemo, useCallback, useState } from "react";
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
  const { items: menuItems = [], refetch } = usePaginatedQuery(MENU_ITEM_MAPPING);
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const bulkDeleteMutation = useBulkDeleteMenuItems();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleFormSubmit = useCallback(
    async (data: CreateMenuItemBody | { id: string; data: UpdateMenuItemBody }) => {
      if ("id" in data) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      await refetch();
      setIsModalOpen(false);
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

  const handleCreate = useCallback(() => {
    setModalMode("create");
    setSelectedItem(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: MenuItem) => {
    setModalMode("edit");
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  // Simple list display - show basic info for each menu item
  const viewFields = useMemo(
    () => [
      { name: "id", label: "ID" },
      { name: "baseName", label: "Name" },
      {
        name: "basePrice",
        label: "Base Price",
        render: (value: any) => `${(value as number).toFixed(2)}€`,
      },
      {
        name: "category",
        label: "Category",
        render: (value: any) => {
          const cat = value as { name: string } | null;
          return cat?.name || "-";
        },
      },
      {
        name: "baseProducts",
        label: "Base Products",
        render: (value: any) => {
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
        render: (value: any) => {
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
        render: (value: any) => (value ? "Yes" : "No"),
      },
      {
        name: "isDisabled",
        label: "Disabled",
        render: (value: any) => (value ? "Yes" : "No"),
      },
      { name: "createdAt", label: "Created At" },
      { name: "updatedAt", label: "Updated At" },
    ],
    [],
  );

  return (
    <>
      {/* For now, simply render a message and the modal button */}
      <div>
        <button onClick={handleCreate}>Create Menu Item</button>
        {/* TODO: Implement proper list view with SmartPaginationList */}
        <p>Menu items list ({menuItems.length} items)</p>
      </div>
      <MenuItemFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        initialData={selectedItem}
        categories={[]}
        products={[]}
        onSubmit={handleFormSubmit}
        onSuccess={async () => {
          handleCloseModal();
          await refetch();
        }}
      />
    </>
  );
};
