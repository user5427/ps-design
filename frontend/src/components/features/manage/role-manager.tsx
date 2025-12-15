import { useState } from "react";
import { useRoles, useCreateRole, useDeleteRole } from "@/queries/roles";
import { useUsers } from "@/queries/users";
import { useScopes } from "@/queries/scopes";
import { apiClient } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import type {
  RoleResponse,
  CreateRoleBody,
  UpdateRoleBody,
} from "@ps-design/schemas/role";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Stack,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Snackbar,
} from "@mui/material";

interface RoleManagerProps {
  businessId: string;
  open?: boolean;
  onClose?: () => void;
}

export function RoleManager({
  businessId,
  open = true,
  onClose,
}: RoleManagerProps) {
  const queryClient = useQueryClient();

  const {
    data: rolesData = [],
    isLoading: rolesLoading,
    error,
  } = useRoles(businessId);
  const createMutation = useCreateRole();
  const deleteMutation = useDeleteRole();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { data: scopes = [] } = useScopes(businessId);
  const { data: users = [] } = useUsers(businessId);

  // Backend filters roles to only return those the user can assign
  const roles = Array.isArray(rolesData) ? rolesData : [];

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      const createData: CreateRoleBody = {
        name: newRoleName,
        description: newRoleDescription || undefined,
        scopes: selectedScopes,
        businessId,
      };
      await createMutation.mutateAsync(createData);
      setShowCreateRoleModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedScopes([]);
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
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
    if (role && (role.name === "SUPERADMIN" || role.name === "OWNER")) {
      setSnackbar({
        open: true,
        message: "Cannot delete SUPERADMIN or OWNER roles",
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
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
    } catch (_error) {
      setSnackbar({
        open: true,
        message: "Failed to delete role",
        severity: "error",
      });
    }
  };

  const handleAssignRole = (role: RoleResponse) => {
    setSelectedRole(role);
    setShowAssignModal(true);
  };

  const handleEditRole = (role: RoleResponse) => {
    setSelectedRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || "");
    setEditScopes(role.scopes || []);
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const updateData: UpdateRoleBody = {
        name: editRoleName,
        description: editRoleDescription || undefined,
      };
      await apiClient.patch(`/roles/${selectedRole.id}`, updateData);

      // Update scopes separately
      await apiClient.post(`/roles/${selectedRole.id}/scopes`, {
        scopes: editScopes,
      });

      setShowEditRoleModal(false);
      setSelectedRole(null);
      setEditRoleName("");
      setEditRoleDescription("");
      setEditScopes([]);
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
      setSnackbar({
        open: true,
        message: "Role updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to update role:", error);
      setSnackbar({
        open: true,
        message: "Failed to update role",
        severity: "error",
      });
    }
  };

  const handleAssignUserToRole = async (userId: string) => {
    if (!selectedRole) return;

    try {
      const user = users.find((u) => u.id === userId);
      const existingRoleIds = user?.roles.map((r) => r.id) || [];
      const newRoleIds = [...new Set([...existingRoleIds, selectedRole.id])];

      await apiClient.post(`/users/${userId}/roles`, {
        roleIds: newRoleIds,
      });
      setSnackbar({
        open: true,
        message: `Role assigned successfully`,
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      queryClient.invalidateQueries({ queryKey: ["scopes"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to assign role"
          : "Failed to assign role";
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
        message: `Role removed successfully`,
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      queryClient.invalidateQueries({ queryKey: ["scopes"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to remove role"
          : "Failed to remove role";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  return (
    <>
      {/* Roles Management Modal */}
      <Dialog
        open={open}
        onClose={() => {
          onClose?.();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Roles Management</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {rolesLoading ? (
            <CircularProgress />
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              {error && <Alert severity="error">Failed to load roles</Alert>}
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
                      {role.name !== "SUPERADMIN" && role.name !== "OWNER" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignRole(role);
                        }}
                      >
                        Assign
                      </Button>
                      {role.name !== "SUPERADMIN" && role.name !== "OWNER" && (
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
        <DialogActions>
          <Button
            onClick={() => {
              onClose?.();
            }}
          >
            Close
          </Button>
        </DialogActions>
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
        <DialogTitle>Create New Role</DialogTitle>
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
              <Box
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  padding: 1,
                }}
              >
                {scopes.map((scope) => (
                  <Box
                    key={scope.name}
                    sx={{ display: "flex", alignItems: "center", padding: 0.5 }}
                  >
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
                            return current.filter(
                              (name) => name !== scope.name,
                            );
                          }
                        });
                      }}
                      style={{ marginRight: 8, cursor: "pointer" }}
                    />
                    <label
                      htmlFor={`scope-${scope.name}`}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {scope.name}
                    </label>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCreateRoleModal(false);
              setNewRoleName("");
              setNewRoleDescription("");
              setSelectedScopes([]);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateRole} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setSelectedRole(null);
          setEditRoleName("");
          setEditRoleDescription("");
          setEditScopes([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Role Name"
              value={editRoleName}
              onChange={(e) => setEditRoleName(e.target.value)}
              fullWidth
              disabled={!!selectedRole?.isSystemRole}
            />
            <TextField
              label="Description"
              value={editRoleDescription}
              onChange={(e) => setEditRoleDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Box>
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Select Scopes:
              </div>
              <Box
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  padding: 1,
                }}
              >
                {scopes.map((scope) => (
                  <Box
                    key={scope.name}
                    sx={{ display: "flex", alignItems: "center", padding: 0.5 }}
                  >
                    <input
                      type="checkbox"
                      id={`edit-scope-${scope.name}`}
                      checked={editScopes.includes(scope.name)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setEditScopes((current) => {
                          if (isChecked) {
                            return [...current, scope.name];
                          } else {
                            return current.filter(
                              (name) => name !== scope.name,
                            );
                          }
                        });
                      }}
                      style={{ marginRight: 8, cursor: "pointer" }}
                    />
                    <label
                      htmlFor={`edit-scope-${scope.name}`}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {scope.name}
                    </label>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowEditRoleModal(false);
              setSelectedRole(null);
              setEditRoleName("");
              setEditRoleDescription("");
              setEditScopes([]);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateRole} variant="contained">
            Update
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
        <DialogTitle>Manage {selectedRole?.name} Role for Users</DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <List sx={{ width: "100%" }}>
              {users.map((user) => {
                const hasRole = user.roles.some(
                  (r) => r.id === selectedRole?.id,
                );
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
                          onClick={() =>
                            handleUnassignUserFromRole(
                              user.id as string,
                              selectedRole?.id || "",
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            handleAssignUserToRole(user.id as string)
                          }
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
          <Button
            onClick={() => {
              setShowAssignModal(false);
              setSelectedRole(null);
            }}
          >
            Close
          </Button>
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
