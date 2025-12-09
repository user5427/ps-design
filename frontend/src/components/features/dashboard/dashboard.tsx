import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { URLS } from "@/constants/urls";
import type { UserResponse } from "@ps-design/schemas/auth";

interface DashboardProps {
  user: UserResponse;
  handleLogout: () => void;
  logoutMutation: {
    isPending: boolean;
  };
  navigate: (options: { to: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  handleLogout,
  logoutMutation,
  navigate,
}) => {
  return (
    <Paper sx={{ p: 4, width: "100%", maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1">{user.email}</Typography>
        </Box>

        {/* <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Role
          </Typography>
          <Chip label={user.role} color="primary" size="small" />
        </Box> */}

        {user.businessId && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Business ID
            </Typography>
            <Typography variant="body1">{user.businessId}</Typography>
          </Box>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate({ to: URLS.CHANGE_PASSWORD })}
        >
          Change Password
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </Stack>
    </Paper>
  );
};
