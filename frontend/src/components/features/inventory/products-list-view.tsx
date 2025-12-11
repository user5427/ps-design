import { AutoRecordListView } from "@/components/elements/record-list-view";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import type { ProductResponse } from "@ps-design/schemas/inventory/product";

export const ProductsListView = () => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const handleCreate = async (values: Partial<ProductResponse>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      description: values.description || undefined,
      productUnitId: String(values.productUnitId),
    });
  };

  const handleEdit = async (id: string, values: Partial<ProductResponse>) => {
    await updateMutation.mutateAsync({
      id,
      name: values.name,
      description: values.description || undefined,
      productUnitId: values.productUnitId,
      isDisabled: values.isDisabled,
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <AutoRecordListView
      mapping={PRODUCT_MAPPING}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
