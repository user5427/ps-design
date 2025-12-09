import { Box, Button, Typography } from "@mui/material";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (token) {
      throw redirect({ to: URLS.DASHBOARD });
    }
  },
  component: HomePage,
});

function HomePage() {
  return (
    <Box
      sx={{
        textAlign: "center",
        mt: 8,
        flex: 1,
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography variant="h2" gutterBottom>
        Welcome to UniServe
      </Typography>
      <Button component={Link} to={URLS.LOGIN} variant="contained" size="large">
        Get Started
      </Button>
    </Box>
  );
}
