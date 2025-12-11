import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { Chip } from "@mui/material";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateStaffService,
  useBulkDeleteStaffServices,
  useStaffServices,
  useUpdateStaffService,
} from "@/hooks/appointments";
import { useServiceDefinitions } from "@/hooks/appointments";
import { useAuthUser } from "@/hooks/auth";
import { useBusinessUsers } from "@/hooks/business";
import type { StaffService } from "@/schemas/appointments";

export const StaffServicesListView = () => {
  const { data: user } = useAuthUser();
  const {
    data: staffServices = [],
    isLoading,
    error,
    refetch,
  } = useStaffServices();
  const { data: serviceDefinitions = [] } = useServiceDefinitions({
    active: true,
  });
  const { data: businessUsers = [] } = useBusinessUsers(
    user?.businessId ?? undefined,
  );
  const createMutation = useCreateStaffService();
  const updateMutation = useUpdateStaffService();
  const bulkDeleteMutation = useBulkDeleteStaffServices();

  const serviceDefinitionOptions = useMemo(
    () =>
      serviceDefinitions.map((def) => ({
        label: def.name,
        value: def.id,
      })),
    [serviceDefinitions],
  );

  const employeeOptions = useMemo(
    () =>
      businessUsers.map((user) => ({
        label: `${user.name} (${user.email})`,
        value: user.id,
      })),
    [businessUsers],
  );

  const columns = useMemo<MRT_ColumnDef<StaffService>[]>(
    () => [
      {
        accessorKey: "employee.name",
        header: "Employee",
        size: 150,
        Cell: ({ row }) => row.original.employee?.name || "",
      },
      {
        accessorKey: "serviceDefinition.name",
        header: "Service",
        size: 200,
        Cell: ({ row }) => row.original.serviceDefinition?.name || "",
      },
      {
        accessorKey: "serviceDefinition.category",
        header: "Category",
        size: 150,
        Cell: ({ row }) => row.original.serviceDefinition?.category?.name || "",
      },
      {
        accessorKey: "price",
        header: "Price",
        size: 100,
        Cell: ({ cell }) => `${cell.getValue<number>().toFixed(2)}€`,
      },
      {
        accessorKey: "baseDuration",
        header: "Duration (min)",
        size: 100,
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => {
          const isDisabled = cell.getValue<boolean>();
          return (
            <Chip
              label={isDisabled ? "Disabled" : "Active"}
              color={isDisabled ? "default" : "success"}
              size="small"
            />
          );
        },
      },
    ],
    [],
  );

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "employeeId",
      label: "Employee",
      type: "select",
      required: true,
      options: employeeOptions,
      placeholder: "Select an employee",
    },
    {
      name: "serviceDefinitionId",
      label: "Service Definition",
      type: "select",
      required: true,
      options: serviceDefinitionOptions,
    },
    {
      name: "price",
      label: "Price (€)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(0)],
    },
    {
      name: "baseDuration",
      label: "Duration (minutes)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(1), ValidationRules.max(480)],
    },
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
      required: false,
      defaultValue: false,
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "price",
      label: "Price (€)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(0)],
    },
    {
      name: "baseDuration",
      label: "Duration (minutes)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(1), ValidationRules.max(480)],
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
    { name: "employee.name", label: "Employee" },
    { name: "employee.email", label: "Employee Email" },
    { name: "serviceDefinition.name", label: "Service" },
    { name: "serviceDefinition.category.name", label: "Category" },
    {
      name: "price",
      label: "Price",
      render: (value) => `${(value as number).toFixed(2)}€`,
    },
    {
      name: "baseDuration",
      label: "Duration",
      render: (value) => `${value} minutes`,
    },
    {
      name: "isDisabled",
      label: "Status",
      render: (value) => (value ? "Disabled" : "Active"),
    },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<StaffService>) => {
    await createMutation.mutateAsync({
      employeeId: (values as { employeeId?: string }).employeeId || "",
      serviceDefinitionId:
        (values as { serviceDefinitionId?: string }).serviceDefinitionId || "",
      price: Number(values.price) || 0,
      baseDuration: Number(values.baseDuration) || 30,
      isDisabled: values.isDisabled || false,
    });
  };

  const handleEdit = async (id: string, values: Partial<StaffService>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        price: values.price !== undefined ? Number(values.price) : undefined,
        baseDuration:
          values.baseDuration !== undefined
            ? Number(values.baseDuration)
            : undefined,
        isDisabled: values.isDisabled,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <RecordListView<StaffService>
      title="Staff Services"
      columns={columns}
      data={staffServices}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Staff Service"
      editModalTitle="Edit Staff Service"
      viewModalTitle="View Staff Service"
    />
  );
};
