import { Box, Typography } from "@mui/material";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: OrderViewPage,
});

function OrderViewPage() {
  const { orderId } = Route.useParams();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Order View
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Order ID: {orderId}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        This is a placeholder for the full order management screen.
      </Typography>
    </Box>
  );
}
