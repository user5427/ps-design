import { useAuthUser } from "@/hooks/auth";
import { RoleManager } from "./role-manager";
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { useState } from "react";

export function BusinessRoles() {
  const { data: currentUser } = useAuthUser();
  const businessId = currentUser?.businessId as string;
  const [showRolesModal, setShowRolesModal] = useState(false);

  if (!businessId) {
    return <Alert severity="info">You are not associated with a business</Alert>;
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
        <Typography variant="h4">Business Roles</Typography>
        
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Manage roles and permissions for your business. Click the button below to view and manage roles.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setShowRolesModal(true)}
            >
              Manage Roles
            </Button>
          </CardContent>
        </Card>
      </Box>

      <RoleManager 
        businessId={businessId} 
        open={showRolesModal}
        onClose={() => setShowRolesModal(false)}
      />
    </>
  );
}
