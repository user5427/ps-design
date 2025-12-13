import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useCallback, useState } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import { useRoles, useCreateRole, useDeleteRole } from "@/hooks/roles";
import { useAuthUser } from "@/hooks/auth";
import { apiClient } from "@/api/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
} from "@mui/material";

type Role = Record<string, unknown> & {
  id: string;
  name: string;
  description: string | null;
  businessId: string | null;
  isDeletable: boolean;
  createdAt: string;
  updatedAt: string;
};

interface Scope {
  name: string;
  description: string | null;
}

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
  createdAt: string;
  updatedAt: string;
};

export function BusinessRoles() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useAuthUser();
  const businessId = currentUser?.businessId as string;

  // All hooks must be called before any conditional returns
  const { data: rolesData = [], isLoading: rolesLoading, error } = useRoles(businessId);
  const createMutation = useCreateRole();
  const deleteMutation = useDeleteRole();
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [assignError, setAssignError] = useState<string>("");
  const [assignSuccess, setAssignSuccess] = useState<string>("");

  // Fetch available scopes
  const { data: scopes = [] } = useQuery<Scope[]>({
    queryKey: ["scopes"],
    queryFn: async () => {
      const response = await apiClient.get("/scopes");
      return response.data;
    },
  });

  // Fetch users for this business only
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users", businessId],
    queryFn: async () => {
      const response = await apiClient.get("/users", {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });

  const columns = useMemo<MRT_ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 300,
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 150,
        Cell: ({ cell }) => new Date(cell.getValue() as string).toLocaleDateString(),
      },
    ],
    [],
  );

  // Cast API response to Role type
  const roles = rolesData as unknown as Role[];

  const handleEdit = useCallback(
    async (id: string, values: Partial<Role>) => {
      await apiClient.put(`/roles/${id}`, {
        name: values.name,
        description: values.description,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
    },
    [queryClient, businessId],
  );

  // Now we can do conditional returns after all hooks
  if (!businessId) {
    return <Alert severity="info">You are not associated with a business</Alert>;
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        scopes: selectedScopes,
        businessId,
      });
      setShowRoleModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedScopes([]);
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    // Filter out non-deletable roles
    const deletableIds = ids.filter((id) => {
      const role = roles.find((r) => r.id === id);
      return role && role.isDeletable;
    });

    if (deletableIds.length === 0) {
      return;
    }

    for (const id of deletableIds) {
      await deleteMutation.mutateAsync(id);
    }
    
    // Refresh the roles list after deletion
    queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
  };

  const handleScopeToggle = (scopeId: string) => {
    setSelectedScopes((prev) => {
      if (prev.includes(scopeId)) {
        return prev.filter((s) => s !== scopeId);
      } else {
        return [...prev, scopeId];
      }
    });
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedRole) return;

    setAssignError("");
    setAssignSuccess("");

    try {
      await apiClient.post(`/users/${userId}/roles`, {
        roleIds: [selectedRole.id],
      });
      setAssignSuccess(`Role "${selectedRole.name}" assigned successfully!`);
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      setTimeout(() => {
        setShowAssignModal(false);
        setSelectedRole(null);
        setAssignSuccess("");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to assign role";
      setAssignError(errorMessage);
      console.error("Failed to assign role:", error);
    }
  };

  const handleUnassignUser = async (userId: string, roleId: string) => {
    setAssignError("");
    setAssignSuccess("");

    try {
      await apiClient.delete(`/users/${userId}/roles/${roleId}`);
      setAssignSuccess("Role removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      setTimeout(() => {
        setAssignSuccess("");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to remove role";
      setAssignError(errorMessage);
      console.error("Failed to remove role:", error);
    }
  };

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [ValidationRules.minLength(1)],
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      required: false,
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert severity="error">{error instanceof Error ? error.message : "Failed to load roles"}</Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowRoleModal(true)}
        >
          Create Role
        </Button>

        <RecordListView<Role>
          title="Business Roles"
          columns={columns}
          data={roles}
          isLoading={rolesLoading}
          error={error}
          editFormFields={editFormFields}
          viewFields={viewFields}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSuccess={refetch}
          editModalTitle="Edit Role"
          viewModalTitle="View Role"
          renderRowActions={({ row }) => (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedRole(row as Role);
                setShowAssignModal(true);
                setAssignError("");
                setAssignSuccess("");
              }}
            >
              Manage
            </Button>
          )}
        />
      </Box>

      {/* Create Role Dialog */}
      <Dialog open={showRoleModal} onClose={() => setShowRoleModal(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage User Roles Dialog */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage {selectedRole?.name} Role for Users</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {assignError && (
              <Alert severity="error">{assignError}</Alert>
            )}
            {assignSuccess && (
              <Alert severity="success">{assignSuccess}</Alert>
            )}
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
                          onClick={() => handleUnassignUser(user.id, selectedRole?.id || "")}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAssignUser(user.id)}
                        >
                          Assign
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAssignModal(false);
            setAssignError("");
            setAssignSuccess("");
          }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
