import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Stack,
  Alert,
  Snackbar,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useRoles, useCreateRole, useDeleteRole } from "@/hooks/roles";

type Business = {
  id: string;
  name: string;
};

type Role = Record<string, unknown> & {
  id: string;
  name: string;
  description: string | null;
  businessId: string | null;
  isDeletable: boolean;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
};

type User = Record<string, unknown> & {
  id: string;
  email: string;
  name: string;
  businessId: string | null;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
};

export function ManageRoles() {
  const queryClient = useQueryClient();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Fetch all businesses for the picker
  const { data: businesses = [], isLoading: businessesLoading } = useQuery<
    Business[]
  >({
    queryKey: ["businesses"],
    queryFn: async () => {
      const response = await apiClient.get("/businesses", {
        params: { limit: 1000 },
      });
      return response.data.items || [];
    },
  });

  // Fetch roles for selected business
  const {
    data: rolesData = [],
    isLoading: rolesLoading,
    error,
  } = useRoles(selectedBusiness?.id);
  const createMutation = useCreateRole();
  const deleteMutation = useDeleteRole();

  // Fetch users for selected business when assigning
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["business-users", selectedBusiness?.id],
    queryFn: async () => {
      if (!selectedBusiness) return [];
      const response = await apiClient.get("/users", {
        params: { businessId: selectedBusiness.id },
      });
      return response.data;
    },
    enabled: !!selectedBusiness && showAssignModal,
  });

  const roles = rolesData as unknown as Role[];

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const handleCloseBusiness = () => {
    setShowBusinessModal(false);
    setSelectedRole(null);
    setSelectedBusiness(null);
  };

  const handleDelete = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role && !role.isDeletable) {
      setSnackbar({
        open: true,
        message: "Cannot delete system roles",
        severity: "error",
      });
      return;
    }

    try {
      await deleteMutation.mutateAsync(roleId);
      setSnackbar({
        open: true,
        message: "Role deleted successfully",
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["roles", selectedBusiness?.id] });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete role",
        severity: "error",
      });
    }
  };

  const handleAssignRole = (role: Role) => {
    setSelectedRole(role);
    setShowAssignModal(true);
  };

  const handleAssignUserToRole = async (userId: string) => {
    if (!selectedRole) return;

    try {
      await apiClient.post(`/users/${userId}/roles`, {
        roleIds: [selectedRole.id],
      });
      setSnackbar({
        open: true,
        message: `Role assigned successfully`,
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["business-users"] });
      setShowAssignModal(false);
      setSelectedRole(null);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to assign role";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  if (businessesLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h2>Manage Business Roles</h2>
        <p>Select a business to manage its roles:</p>

        <List sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
          {businesses.map((business) => (
            <ListItemButton
              key={business.id}
              onClick={() => handleSelectBusiness(business)}
            >
              <ListItemText primary={business.name} />
            </ListItemButton>
          ))}
        </List>

        {businesses.length === 0 && (
          <Alert severity="info">No businesses available</Alert>
        )}
      </Box>

      {/* Business Roles Modal */}
      <Dialog
        open={showBusinessModal}
        onClose={handleCloseBusiness}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedBusiness?.name} - Roles</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {rolesLoading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {error && (
                <Alert severity="error">Failed to load roles</Alert>
              )}
              <List sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
                {roles.map((role) => (
                  <ListItemButton
                    key={role.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 2,
                      px: 2,
                    }}
                  >
                    <ListItemText
                      primary={role.name}
                      secondary={role.description || "No description"}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignRole(role as Role);
                        }}
                      >
                        Assign
                      </Button>
                      {role.isDeletable && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(role.id as string);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </ListItemButton>
                ))}
              </List>
              {roles.length === 0 && (
                <Alert severity="info">No roles in this business</Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* User Assignment Modal */}
      <Dialog
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedRole(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign {selectedRole?.name} to User
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {selectedRole && (
              <Alert severity="info">
                Assigning role: <strong>{selectedRole.name}</strong>
              </Alert>
            )}
            <List sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
              {users.map((user) => (
                <ListItemButton
                  key={user.id}
                  onClick={() => handleAssignUserToRole(user.id as string)}
                  sx={{
                    py: 2,
                    px: 2,
                  }}
                >
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                </ListItemButton>
              ))}
            </List>
            {users.length === 0 && (
              <Alert severity="info">No users in this business</Alert>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

