import { AutoRecordListView } from "@/components/elements/record-list-view";
import { BUSINESS_MAPPING } from "@ps-design/constants/business";
import { useCreateBusiness, useDeleteBusiness } from "@/queries/business/business";
import { apiClient } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import type { BusinessResponse } from "@ps-design/schemas/business";

export const BusinessList: React.FC = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateBusiness();
  const deleteMutation = useDeleteBusiness();

  const handleCreate = async (values: Partial<BusinessResponse>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
  };

  const handleEdit = async (id: string, values: Partial<BusinessResponse>) => {
    await apiClient.put(`/business/${id}`, {
      name: String(values.name),
    });
    queryClient.invalidateQueries({ queryKey: ["business"] });
  };

  const handleDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <AutoRecordListView
      mapping={BUSINESS_MAPPING}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
