import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";
import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/api/client";

export const Route = createFileRoute("/businesses/$businessId")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: BusinessLayout,
});

function BusinessLayout() {
  const { businessId } = Route.useParams();
  const location = window.location.pathname;

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const response = await api.get(`/business/${businessId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const currentTab = location.includes("/roles")
    ? "roles"
    : location.includes("/users")
      ? "users"
      : "edit";

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manage Business: {business?.name}
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs value={currentTab}>
            <Tab
              label="Details"
              value="edit"
              component={Link}
              to={URLS.BUSINESS_EDIT(businessId)}
            />
            <Tab
              label="Roles"
              value="roles"
              component={Link}
              to={URLS.BUSINESS_ROLES(businessId)}
            />
            <Tab
              label="Users"
              value="users"
              component={Link}
              to={URLS.BUSINESS_USERS(businessId)}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <Outlet />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
