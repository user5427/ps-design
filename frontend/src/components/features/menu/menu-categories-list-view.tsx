import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateMenuCategory,
  useBulkDeleteMenuCategories,
  useUpdateMenuCategory,
} from "@/queries/menu";
import { MENU_ITEM_CATEGORY_MAPPING } from "@ps-design/constants/menu/category";
import type { MenuItemCategoryResponse as MenuItemCategory } from "@ps-design/schemas/menu/category";

export const MenuCategoriesListView = () => {
  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();
  const bulkDeleteMutation = useBulkDeleteMenuCategories();

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(50),
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
      mapping={MENU_ITEM_CATEGORY_MAPPING}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      createModalTitle="Create Menu Category"
      editModalTitle="Edit Menu Category"
      viewModalTitle="View Menu Category"
    />
  );
};
