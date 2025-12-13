import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    CircularProgress,
} from "@mui/material";
import type { Appointment } from "@/schemas/appointments";
import { useRefundAppointment } from "@/hooks/appointments";

interface RefundAppointmentDialogProps {
    open: boolean;
    appointment: Appointment | null;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const RefundAppointmentDialog: React.FC<RefundAppointmentDialogProps> = ({
    open,
    appointment,
    onCancel,
    onSuccess,
}) => {
    const [reason, setReason] = useState("");
    const refundMutation = useRefundAppointment();

    if (!appointment) return null;

    const handleConfirm = async () => {
        await refundMutation.mutateAsync({
            id: appointment.id,
            reason: reason || undefined,
        });
        setReason("");
        onCancel();
        onSuccess?.();
    };

    const handleClose = () => {
        setReason("");
        onCancel();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Refund Appointment</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Are you sure you want to refund the payment for{" "}
                    <strong>{appointment.customerName}</strong>?
                </Typography>
                <TextField
                    label="Reason (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter reason for refund..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={refundMutation.isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleConfirm}
                    disabled={refundMutation.isPending}
                    startIcon={
                        refundMutation.isPending ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : null
                    }
                >
                    {refundMutation.isPending ? "Processing..." : "Confirm Refund"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
