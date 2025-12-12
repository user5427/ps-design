import { useState } from "react";
import {
  useCreateMenuItem,
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  return (
    <>
      {/* For now, simply render a message and the modal button */}
      <div>
        <button onClick={() => {
          setModalMode("create");
          setSelectedItem(null);
          setIsModalOpen(true);
        }}>Create Menu Item</button>
        {/* TODO: Implement proper list view with SmartPaginationList */}
        <p>Menu items list ({menuItems.length} items)</p>
      </div>
      <MenuItemFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        mode={modalMode}
        initialData={selectedItem}
        categories={[]}
        products={[]}
        onSubmit={async (data: CreateMenuItemBody | { id: string; data: UpdateMenuItemBody }) => {
          if ("id" in data) {
            await updateMutation.mutateAsync(data);
          } else {
            await createMutation.mutateAsync(data);
          }
          await refetch();
          setIsModalOpen(false);
        }}
        onSuccess={async () => {
          setIsModalOpen(false);
          setSelectedItem(null);
          await refetch();
        }}
      />
    </>
  );
};
