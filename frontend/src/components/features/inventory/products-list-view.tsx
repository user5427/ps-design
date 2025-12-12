import { useCallback } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { PRODUCT_MAPPING, PRODUCT_CONSTRAINTS } from "@ps-design/constants/inventory/product";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import type { ProductResponse } from "@ps-design/schemas/inventory/product";

export const ProductsListView = () => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH),
        ValidationRules.maxLength(PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH),
      ],
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
      validationRules: [
        ValidationRules.maxLength(PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH),
      ],
    },
    {
      name: "productUnitId",
      label: "Product Unit",
      type: "pagination",
      required: true,
      paginationMapping: PRODUCT_UNIT_MAPPING,
      placeholder: "Select a product unit",
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH),
        ValidationRules.maxLength(PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH),
      ],
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
      validationRules: [
        ValidationRules.maxLength(PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH),
      ],
    },
    {
      name: "productUnitId",
      label: "Product Unit",
      type: "pagination",
      required: true,
      paginationMapping: PRODUCT_UNIT_MAPPING,
      placeholder: "Select a product unit",
    },
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
      required: false,
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    {
      name: "productUnit",
      label: "Product Unit",
      render: (value) => {
        const unit = value as { name: string; symbol?: string } | null;
        if (!unit) return "-";
        return unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name;
      },
    },
    {
      name: "isDisabled",
      label: "Disabled",
      render: (value) => (value ? "Yes" : "No"),
    },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      description: values.description ? String(values.description) : undefined,
      productUnitId: String(values.productUnitId),
    });
  };

  const handleEdit = useCallback(
    async (id: string, values: Record<string, unknown>) => {
      await updateMutation.mutateAsync({
        id,
        name: values.name ? String(values.name) : undefined,
        description: values.description ? String(values.description) : undefined,
        productUnitId: values.productUnitId ? String(values.productUnitId) : undefined,
        isDisabled: values.isDisabled as boolean | undefined,
      });
    },
    [updateMutation],
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      await bulkDeleteMutation.mutateAsync(ids);
    },
    [bulkDeleteMutation],
  );

  return (
    <RecordListView<ProductResponse>
      mapping={PRODUCT_MAPPING}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      createModalTitle="Create Product"
      editModalTitle="Edit Product"
      viewModalTitle="View Product"
    />
  );
};
