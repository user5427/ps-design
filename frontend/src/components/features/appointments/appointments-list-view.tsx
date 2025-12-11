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
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useBulkDeleteAppointments,
} from "@/hooks/appointments";
import { useStaffServices } from "@/hooks/appointments";
import type { Appointment, AppointmentStatus } from "@/schemas/appointments";

const STATUS_COLORS: Record<AppointmentStatus, "default" | "primary" | "success" | "error" | "warning"> = {
  RESERVED: "primary",
  COMPLETED: "success",
  CANCELLED: "error",
  PAID: "success",
};

export const AppointmentsListView = () => {
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useAppointments();
  const { data: staffServices = [] } = useStaffServices();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const bulkDeleteMutation = useBulkDeleteAppointments();

  const staffServiceOptions = useMemo(
    () =>
      staffServices
        .filter((ss) => !ss.isDisabled)
        .map((ss) => ({
          label: `${ss.employee.name} - ${ss.serviceDefinition.name} (${ss.price.toFixed(2)}€)`,
          value: ss.id,
        })),
    [staffServices],
  );

  const columns = useMemo<MRT_ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: "customerName",
        header: "Customer",
        size: 150,
      },
      {
        accessorKey: "service.serviceDefinition.name",
        header: "Service",
        size: 150,
        Cell: ({ row }) => row.original.service?.serviceDefinition?.name || "-",
      },
      {
        accessorKey: "service.employee.name",
        header: "Employee",
        size: 150,
        Cell: ({ row }) => row.original.service?.employee?.name || "-",
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        size: 180,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleString() : "";
        },
      },
      {
        accessorKey: "blockDuration",
        header: "Duration",
        size: 100,
        Cell: ({ cell }) => `${cell.getValue<number>()} min`,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<AppointmentStatus>();
          return (
            <Chip
              label={status}
              color={STATUS_COLORS[status] || "default"}
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
      name: "serviceId",
      label: "Staff Service",
      type: "select",
      required: true,
      options: staffServiceOptions,
    },
    {
      name: "customerName",
      label: "Customer Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(100),
      ],
    },
    {
      name: "customerPhone",
      label: "Customer Phone",
      type: "text",
      required: false,
    },
    {
      name: "customerEmail",
      label: "Customer Email",
      type: "email",
      required: false,
    },
    {
      name: "startTime",
      label: "Start Time",
      type: "datetime",
      required: true,
    },
    {
      name: "blockDuration",
      label: "Duration (minutes)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(1), ValidationRules.max(480)],
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      validationRules: [ValidationRules.maxLength(1000)],
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "customerName",
      label: "Customer Name",
      type: "text",
      required: false,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(100),
      ],
    },
    {
      name: "customerPhone",
      label: "Customer Phone",
      type: "text",
      required: false,
    },
    {
      name: "customerEmail",
      label: "Customer Email",
      type: "email",
      required: false,
    },
    {
      name: "startTime",
      label: "Start Time",
      type: "datetime",
      required: false,
    },
    {
      name: "blockDuration",
      label: "Duration (minutes)",
      type: "number",
      required: false,
      validationRules: [ValidationRules.min(1), ValidationRules.max(480)],
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      validationRules: [ValidationRules.maxLength(1000)],
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "customerName", label: "Customer Name" },
    { name: "customerPhone", label: "Customer Phone" },
    { name: "customerEmail", label: "Customer Email" },
    { name: "service.employee.name", label: "Employee" },
    { name: "service.serviceDefinition.name", label: "Service" },
    { name: "service.serviceDefinition.category.name", label: "Category" },
    {
      name: "service.price",
      label: "Price",
      render: (value) => `${(value as number).toFixed(2)}€`,
    },
    {
      name: "startTime",
      label: "Start Time",
      render: (value) =>
        value ? new Date(value as string).toLocaleString() : "-",
    },
    {
      name: "blockDuration",
      label: "Duration",
      render: (value) => `${value} minutes`,
    },
    { name: "status", label: "Status" },
    { name: "notes", label: "Notes" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<Appointment>) => {
    const data = values as {
      serviceId?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      startTime?: string;
      blockDuration?: number;
      notes?: string;
    };

    await createMutation.mutateAsync({
      serviceId: data.serviceId || "",
      customerName: data.customerName || "",
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      startTime: data.startTime || new Date().toISOString(),
      blockDuration: Number(data.blockDuration) || 30,
      notes: data.notes || null,
    });
  };

  const handleEdit = async (id: string, values: Partial<Appointment>) => {
    const data = values as {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      startTime?: string;
      blockDuration?: number;
      notes?: string;
    };

    await updateMutation.mutateAsync({
      id,
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        startTime: data.startTime,
        blockDuration:
          data.blockDuration !== undefined
            ? Number(data.blockDuration)
            : undefined,
        notes: data.notes,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  return (
    <RecordListView<Appointment>
      title="Appointments"
      columns={columns}
      data={appointments}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Appointment"
      editModalTitle="Edit Appointment"
      viewModalTitle="View Appointment"
    />
  );
};
