import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import {
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
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
import type { Appointment, AppointmentStatus } from "@/schemas/appointments";
import { CreateAppointmentModal } from "./create-appointment-modal";
import { PayModal } from "./pay-modal";
import dayjs from "dayjs";

const STATUS_COLORS: Record<
  AppointmentStatus,
  "default" | "primary" | "success" | "error" | "warning"
> = {
  RESERVED: "primary",
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
  const updateStatusMutation = useUpdateAppointmentStatus();

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelAppointment = useCallback(async () => {
    if (!selectedAppointment) return;

    setIsCancelling(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedAppointment.id,
        status: "CANCELLED",
      });
      refetch();
      setCancelModalOpen(false);
      setSelectedAppointment(null);
    } finally {
      setIsCancelling(false);
    }
  }, [updateStatusMutation, refetch, selectedAppointment]);

  const handleOpenCancelModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelModalOpen(true);
  }, []);

  const handleOpenPayModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPayModalOpen(true);
  }, []);

  const staffServiceOptions = useMemo(
    () =>
      staffServices
        .filter((ss) => !ss.isDisabled)
        .map((ss) => ({
          label: `${ss.serviceDefinition.name} (${ss.serviceDefinition.price.toFixed(2)}€)`,
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

  const renderRowActions = useCallback(
    ({ row, openEditModal }: RowActionsContext<Appointment>) => {
      const isReserved = row.status === "RESERVED";

      if (!isReserved) return null;

      return (
        <>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditModal(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Appointment">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenCancelModal(row)}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pay">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenPayModal(row)}
            >
              <PaymentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      );
    },
    [handleOpenCancelModal, handleOpenPayModal],
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
        value ? dayjs(value as string).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      name: "service.serviceDefinition.duration",
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

      {/* Pay Modal */}
      <PayModal
        open={payModalOpen}
        onClose={() => {
          setPayModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this appointment for{" "}
            <strong>{selectedAppointment?.customerName}</strong>?
            {selectedAppointment?.startTime && (
              <>
                {" "}
                Scheduled for{" "}
                <strong>
                  {dayjs(selectedAppointment.startTime).format(
                    "YYYY-MM-DD HH:mm",
                  )}
                </strong>
                .
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCancelModalOpen(false);
              setSelectedAppointment(null);
            }}
            disabled={isCancelling}
          >
            No, Keep It
          </Button>
          <Button
            onClick={handleCancelAppointment}
            color="error"
            variant="contained"
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Yes, Cancel Appointment"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
