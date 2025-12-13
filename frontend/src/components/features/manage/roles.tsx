import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  TextField,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useRoles, useCreateRole, useDeleteRole } from "@/hooks/roles";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import { useBusinessesPaginated, useDeleteBusiness } from "@/queries/business";

type Business = Record<string, unknown> & {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
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

interface Scope {
  name: string;
  description: string | null;
}

export function ManageRoles() {
  const queryClient = useQueryClient();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Fetch all businesses for the picker
  const { data: businessData, isLoading: businessesLoading, error: businessError, refetch: refetchBusinesses } = useBusinessesPaginated(
    1,
    1000,
    undefined,
  );
  const businesses = businessData?.items || [];
  const deleteMutation = useDeleteBusiness();

  // Fetch roles for selected business
  const {
    data: rolesData = [],
    isLoading: rolesLoading,
    error,
  } = useRoles(selectedBusiness?.id);
  const createRoleMutation = useCreateRole();
  const deleteRoleMutation = useDeleteRole();

  // Fetch available scopes
  const { data: scopes = [] } = useQuery<Scope[]>({
    queryKey: ["scopes"],
    queryFn: async () => {
      const response = await apiClient.get("/scopes");
      return response.data;
    },
  });

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

  const businessColumns = useMemo<MRT_ColumnDef<Business>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "id",
        header: "ID",
        size: 200,
      },
    ],
    [],
  );

  const businessViewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const handleCloseBusiness = () => {
    setShowBusinessModal(false);
    setSelectedRole(null);
    setSelectedBusiness(null);
    setShowCreateRoleModal(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedScopes([]);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !selectedBusiness) return;

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        scopes: selectedScopes,
        businessId: selectedBusiness.id,
      });
      setShowCreateRoleModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedScopes([]);
      queryClient.invalidateQueries({ queryKey: ["roles", selectedBusiness.id] });
      setSnackbar({
        open: true,
        message: "Role created successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to create role:", error);
      setSnackbar({
        open: true,
        message: "Failed to create role",
        severity: "error",
      });
    }
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
      await deleteRoleMutation.mutateAsync(roleId);
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
      queryClient.invalidateQueries({ queryKey: ["business-users", selectedBusiness?.id] });
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

  const handleUnassignUserFromRole = async (userId: string, roleId: string) => {
    try {
      await apiClient.delete(`/users/${userId}/roles/${roleId}`);
      setSnackbar({
        open: true,
        message: "Role removed successfully",
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["business-users", selectedBusiness?.id] });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to remove role";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  return (
    <>
      <RecordListView<Business>
        title="Manage Business Roles"
        columns={businessColumns}
        data={businesses}
        isLoading={businessesLoading}
        error={businessError}
        viewFields={businessViewFields}
        onSuccess={refetchBusinesses}
        viewModalTitle="View Business"
        renderRowActions={({ row }) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleSelectBusiness(row as Business)}
          >
            Manage Roles
          </Button>
        )}
      />

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
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowCreateRoleModal(true)}
              >
                Create Role
              </Button>
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

      {/* Create Role Dialog */}
      <Dialog 
        open={showCreateRoleModal} 
        onClose={() => {
          setShowCreateRoleModal(false);
          setNewRoleName("");
          setNewRoleDescription("");
          setSelectedScopes([]);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Create New Role for {selectedBusiness?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Role Name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Box>
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Select Scopes:
              </div>
              <Box sx={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: 1, padding: 1 }}>
                {scopes.map((scope) => (
                  <Box key={scope.name} sx={{ display: "flex", alignItems: "center", padding: 0.5 }}>
                    <input
                      type="checkbox"
                      id={`scope-${scope.name}`}
                      checked={selectedScopes.includes(scope.name)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedScopes((current) => {
                          if (isChecked) {
                            return [...current, scope.name];
                          } else {
                            return current.filter((name) => name !== scope.name);
                          }
                        });
                      }}
                      style={{ marginRight: 8, cursor: "pointer" }}
                    />
                    <label htmlFor={`scope-${scope.name}`} style={{ cursor: "pointer", userSelect: "none" }}>
                      {scope.name}
                    </label>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCreateRoleModal(false);
            setNewRoleName("");
            setNewRoleDescription("");
            setSelectedScopes([]);
          }}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">
            Create
          </Button>
        </DialogActions>
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
          Manage {selectedRole?.name} Role for Users
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <List sx={{ width: "100%" }}>
              {users.map((user) => {
                const hasRole = user.roles.some((r) => r.id === selectedRole?.id);
                return (
                  <Box
                    key={user.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 1,
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <Box>
                      <div style={{ fontWeight: "bold" }}>{user.name}</div>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        {user.email}
                      </div>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {hasRole ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleUnassignUserFromRole(user.id as string, selectedRole?.id || "")}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAssignUserToRole(user.id as string)}
                        >
                          Assign
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </List>
            {users.length === 0 && (
              <Alert severity="info">No users in this business</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAssignModal(false);
            setSelectedRole(null);
          }}>Close</Button>
        </DialogActions>
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

