import { useCallback } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useDeleteBusiness,
  useCreateBusiness,
  useUpdateBusiness,
} from "@/queries/business";
import type { BusinessResponse } from "@ps-design/schemas/business";
import { BUSINESS_MAPPING, BUSINESS_CONSTRAINTS } from "@ps-design/constants/business";

export const BusinessList: React.FC = () => {
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH),
        ValidationRules.maxLength(BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH),
      ],
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH),
        ValidationRules.maxLength(BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH),
      ],
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<BusinessResponse>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
  };

  const handleEdit = useCallback(
    async (id: string, values: Partial<BusinessResponse>) => {
      await updateMutation.mutateAsync({
        id,
        name: String(values.name),
      });
    },
    [updateMutation],
  );

  const handleDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <RecordListView<BusinessResponse>
      mapping={BUSINESS_MAPPING}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      createModalTitle="Create Business"
      editModalTitle="Edit Business"
      viewModalTitle="View Business"
    />
  );
};
