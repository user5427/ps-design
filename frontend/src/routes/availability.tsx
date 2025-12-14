import { useState } from "react";
import { Container, Typography, Alert, Snackbar } from "@mui/material";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { useAuthUser } from "@/hooks/auth/auth-hooks";
import type { AvailabilityFormData } from "@/components/features/availability/availability-form";
import { AvailabilityForm } from "@/components/features/availability/availability-form";
import {
  useUserAvailability,
  useUpdateAvailability,
} from "@/hooks/appointments/availability-hooks";

export const Route = createFileRoute("/availability")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const { data: user } = useAuthUser();
  const { data: availability, isLoading: isLoadingAvailability } =
    useUserAvailability(user?.id);
  const updateAvailabilityMutation = useUpdateAvailability();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (data: AvailabilityFormData) => {
    if (!user?.id) return;

    try {
      await updateAvailabilityMutation.mutateAsync({
        userId: user.id,
        data,
      });
      setSnackbar({
        open: true,
        message: "Availability updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to update availability:", error);
      setSnackbar({
        open: true,
        message: "Failed to update availability",
        severity: "error",
      });
    }
  };

  if (isLoadingAvailability) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Availability
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Set your weekly working hours. Use the "Overnight" option for shifts
        that extend past midnight.
      </Typography>

      <AvailabilityForm
        initialData={availability}
        onSubmit={handleSubmit}
        isPending={updateAvailabilityMutation.isPending}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
