import { AutoRecordListView } from "@/components/elements/record-list-view";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useUpdateProductUnit,
} from "@/queries/inventory/units";
import type { ProductUnitResponse } from "@ps-design/schemas/inventory/product-unit";

export const ProductUnitsListView = () => {
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  const handleCreate = async (values: Partial<ProductUnitResponse>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      symbol: values.symbol || undefined,
    });
  };

  const handleEdit = async (id: string, values: Partial<ProductUnitResponse>) => {
    await updateMutation.mutateAsync({
      id,
      name: values.name,
      symbol: values.symbol || undefined,
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <AutoRecordListView
      mapping={PRODUCT_UNIT_MAPPING}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
