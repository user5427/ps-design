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
import { CreateAppointmentModal } from "./create-appointment-modal";

const STATUS_COLORS: Record<
  AppointmentStatus,
  "default" | "primary" | "success" | "error" | "warning"
> = {
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
          label: `${ss.serviceDefinition.name} (${ss.serviceDefinition.price.toFixed(2)}€)`,
          value: ss.id,
          baseDuration: ss.serviceDefinition.baseDuration,
        })),
    [staffServices],
  );

  const serviceDefinitionOptions = useMemo(() => {
    // Group staff services by service definition and get the first duration for each
    const serviceDefMap = new Map<
      string,
      { label: string; value: string; baseDuration: number }
    >();

    staffServices
      .filter((ss) => !ss.isDisabled)
      .forEach((ss) => {
        if (!serviceDefMap.has(ss.serviceDefinition.id)) {
          serviceDefMap.set(ss.serviceDefinition.id, {
            label: ss.serviceDefinition.name,
            value: ss.serviceDefinition.id,
            baseDuration: ss.serviceDefinition.baseDuration,
          });
        }
      });

    return Array.from(serviceDefMap.values());
  }, [staffServices]);

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
        accessorKey: "service.baseDuration",
        header: "Duration",
        size: 100,
        Cell: ({ row }) => `${row.original.service?.baseDuration || 0} min`,
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
      name: "service.serviceDefinition.price",
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
      name: "service.baseDuration",
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
      notes?: string;
    };

    await createMutation.mutateAsync({
      serviceId: data.serviceId || "",
      customerName: data.customerName || "",
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      startTime: data.startTime || new Date().toISOString(),
      notes: data.notes || null,
    });
  };

  const handleEdit = async (id: string, values: Partial<Appointment>) => {
    const data = values as {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      notes?: string;
    };

    await updateMutation.mutateAsync({
      id,
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
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
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Appointment"
      editModalTitle="Edit Appointment"
      viewModalTitle="View Appointment"
      renderCustomCreateModal={({ open, onClose, onSuccess }) => (
        <CreateAppointmentModal
          open={open}
          onClose={onClose}
          onCreate={async (values) => {
            await handleCreate(values);
            onSuccess();
          }}
          staffServiceOptions={staffServiceOptions}
          serviceDefinitionOptions={serviceDefinitionOptions}
        />
      )}
    />
  );
};
