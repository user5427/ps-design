import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import { Chip } from "@mui/material";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  type RowActionsContext,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/appointments";
import { useStaffServices } from "@/hooks/appointments";
import type {
  Appointment,
  AppointmentStatus,
  StaffServiceResponse,
  PaymentLineItem,
} from "@/schemas/appointments";
import { CreateAppointmentModal } from "./create-appointment-modal";
import { PayModal } from "./pay-modal";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import { RefundAppointmentDialog } from "./refund-appointment-dialog";
import { AppointmentRowActions } from "./appointment-row-actions";
import { formatPrice } from "@/utils/price";
import dayjs from "dayjs";

const STATUS_COLORS: Record<
  AppointmentStatus,
  "default" | "primary" | "success" | "error" | "warning"
> = {
  RESERVED: "primary",
  CANCELLED: "error",
  PAID: "success",
  REFUNDED: "warning",
};

const AppointmentStatusChip = ({ status }: { status: AppointmentStatus }) => (
  <Chip
    label={status}
    color={STATUS_COLORS[status] || "default"}
    size="small"
  />
);

export const AppointmentsListView = () => {
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useAppointments();
  const { data: staffServices = [] }: { data?: StaffServiceResponse[] } =
    useStaffServices();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const [payAppointment, setPayAppointment] = useState<Appointment | null>(
    null,
  );
  const [cancelAppointment, setCancelAppointment] =
    useState<Appointment | null>(null);
  const [refundAppointment, setRefundAppointment] =
    useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelAppointment) return;

    setIsCancelling(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: cancelAppointment.id,
        status: "CANCELLED",
      });
      refetch();
      setCancelAppointment(null);
    } finally {
      setIsCancelling(false);
    }
  }, [updateStatusMutation, refetch, cancelAppointment]);

  const handleOpenCancelModal = useCallback((appointment: Appointment) => {
    setCancelAppointment(appointment);
  }, []);

  const handleOpenPayModal = useCallback((appointment: Appointment) => {
    setPayAppointment(appointment);
  }, []);

  const handleOpenRefundModal = useCallback((appointment: Appointment) => {
    setRefundAppointment(appointment);
  }, []);

  const staffServiceOptions = useMemo(
    () =>
      staffServices
        .filter((ss) => !ss.isDisabled)
        .map((ss) => ({
          label: `${ss.serviceDefinition.name} (${formatPrice(ss.serviceDefinition.price)})`,
          value: ss.id,
          duration: ss.serviceDefinition.duration,
        })),
    [staffServices],
  );

  const serviceDefinitionOptions = useMemo(() => {
    const serviceDefMap = new Map<
      string,
      { label: string; value: string; duration: number }
    >();

    staffServices
      .filter((ss) => !ss.isDisabled)
      .forEach((ss) => {
        if (!serviceDefMap.has(ss.serviceDefinition.id)) {
          serviceDefMap.set(ss.serviceDefinition.id, {
            label: ss.serviceDefinition.name,
            value: ss.serviceDefinition.id,
            duration: ss.serviceDefinition.duration,
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
          return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
        },
      },
      {
        accessorKey: "service.serviceDefinition.duration",
        header: "Duration",
        size: 100,
        Cell: ({ row }) =>
          `${row.original.service?.serviceDefinition?.duration || 0} min`,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<AppointmentStatus>();
          return <AppointmentStatusChip status={status} />;
        },
      },
    ],
    [],
  );

  const renderRowActions = useCallback(
    ({ row, openEditModal }: RowActionsContext<Appointment>) => {
      return (
        <AppointmentRowActions
          appointment={row}
          openEditModal={openEditModal}
          onCancel={() => handleOpenCancelModal(row)}
          onPay={() => handleOpenPayModal(row)}
          onRefund={() => handleOpenRefundModal(row)}
        />
      );
    },
    [handleOpenCancelModal, handleOpenPayModal, handleOpenRefundModal],
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
      label: "Service Price",
      render: (value) => formatPrice(value as number),
    },
    {
      name: "startTime",
      label: "Start Time",
      render: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      name: "service.serviceDefinition.duration",
      label: "Duration",
      render: (value) => `${value} minutes`,
    },
    { name: "status", label: "Status" },
    {
      name: "payment.totalAmount",
      label: "Total Paid",
      render: (value, row) => {
        if (!row.payment) return "-";
        return formatPrice(value as number);
      },
    },
    {
      name: "payment.paymentMethod",
      label: "Payment Method",
      render: (value) => (value ? (value as string) : "-"),
    },
    {
      name: "payment.lineItems",
      label: "Payment Details",
      render: (value) => {
        if (!Array.isArray(value) || value.length === 0) return "-";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {value.map((item: PaymentLineItem) => (
              <span key={item.id} style={{ fontSize: "0.875rem" }}>
                {item.label}: {formatPrice(item.amount)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: "payment.refundedAt",
      label: "Refunded At",
      render: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      name: "payment.refundReason",
      label: "Refund Reason",
      render: (value) => (value ? (value as string) : "-"),
    },
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
    refetch();
  };

  return (
    <>
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
        onSuccess={() => refetch()}
        createModalTitle="Create Appointment"
        editModalTitle="Edit Appointment"
        viewModalTitle="View Appointment"
        hasViewAction={true}
        hasEditAction={false}
        enableMultiRowSelection={false}
        renderRowActions={renderRowActions}
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

      <PayModal
        open={!!payAppointment}
        onClose={() => setPayAppointment(null)}
        appointment={payAppointment}
        onSuccess={() => refetch()}
      />

      <CancelAppointmentDialog
        open={!!cancelAppointment}
        appointment={cancelAppointment}
        isLoading={isCancelling}
        onCancel={() => setCancelAppointment(null)}
        onConfirm={handleConfirmCancel}
      />

      <RefundAppointmentDialog
        open={!!refundAppointment}
        appointment={refundAppointment}
        onCancel={() => setRefundAppointment(null)}
        onSuccess={() => refetch()}
      />
    </>
  );
};
