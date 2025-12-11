import { Box, Typography } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dashboard } from "@/components/features/dashboard";
import { useAuthUser, useLogout } from "@/hooks/auth/auth-hooks";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useAuthUser();
  const logoutMutation = useLogout();

  if (isError) {
    navigate({ to: "/" });
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
    }
    navigate({ to: "/" });
  };

  if (isLoading || !user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Dashboard
        user={user}
        handleLogout={handleLogout}
        logoutMutation={logoutMutation}
        navigate={navigate}
      />
    </Box>
  );
}
