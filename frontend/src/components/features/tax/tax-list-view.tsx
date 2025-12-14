import { useMemo } from "react";
import type { MRT_ColumnDef } from "material-react-table";
import dayjs from "dayjs";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useTaxes,
  useCreateTax,
  useUpdateTax,
  useDeleteTax,
} from "@/hooks/tax";
import type { TaxResponse } from "@ps-design/schemas/tax";

export const TaxesListView = () => {
  const { data: taxes = [], isLoading, error, refetch } = useTaxes();
  const createMutation = useCreateTax();
  const updateMutation = useUpdateTax();
  const deleteMutation = useDeleteTax();

  const columns = useMemo<MRT_ColumnDef<TaxResponse>[]>(
    () => [
      { accessorKey: "name", header: "Name", size: 200 },
      { accessorKey: "rate", header: "Rate (%)", size: 100 },
      { accessorKey: "description", header: "Description", size: 300 },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 180,
        Cell: ({ cell }) =>
          dayjs(cell.getValue<string>()).format("YYYY-MM-DD HH:mm"),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        size: 180,
        Cell: ({ cell }) =>
          dayjs(cell.getValue<string>()).format("YYYY-MM-DD HH:mm"),
      },
    ],
    [],
  );

  const createFormFields: FormFieldDefinition[] = [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "rate",
      label: "Rate (%)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(0, "Rate must be >= 0")],
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      required: false,
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    { name: "name", label: "Name", type: "text", required: false },
    {
      name: "rate",
      label: "Rate (%)",
      type: "number",
      required: false,
      validationRules: [ValidationRules.min(0, "Rate must be >= 0")],
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      required: false,
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "rate", label: "Rate (%)" },
    { name: "description", label: "Description" },
    {
      name: "createdAt",
      label: "Created At",
      render: (v) => dayjs(v as string).format("YYYY-MM-DD HH:mm"),
    },
    {
      name: "updatedAt",
      label: "Updated At",
      render: (v) => dayjs(v as string).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const handleCreate = async (values: Partial<TaxResponse>) => {
    if (values.rate == null) throw new Error("Rate is required");

    await createMutation.mutateAsync({
      name: String(values.name),
      rate: Number(values.rate),
      description: values.description ?? null,
    });
  };

  const handleEdit = async (id: string, values: Partial<TaxResponse>) => {
    const data: any = {};
    if (values.name !== undefined) data.name = values.name;
    if (values.rate !== undefined && values.rate !== null)
      data.rate = Number(values.rate);
    if (values.description !== undefined)
      data.description = values.description ?? null;

    await updateMutation.mutateAsync({ id, data });
  };

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
  };

  return (
    <RecordListView<TaxResponse>
      title="Taxes"
      columns={columns}
      data={taxes}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Tax"
      editModalTitle="Edit Tax"
      viewModalTitle="View Tax"
    />
  );
};
