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
  id: string;
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

  if (!businessId) {
    return <Alert severity="info">You are not associated with a business</Alert>;
  }

  const { data: rolesData = [], isLoading: rolesLoading, error } = useRoles(businessId);
  const createMutation = useCreateRole();
  const deleteMutation = useDeleteRole();
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Cast API response to Role type
  const roles = rolesData as unknown as Role[];

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

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        scopeIds: selectedScopes,
        businessId,
      });
      setShowRoleModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedScopes([]);
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

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
  };

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    setSelectedScopes((prev) =>
      checked ? [...prev, scopeId] : prev.filter((s) => s !== scopeId)
    );
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedRole) return;

    try {
      await apiClient.post(`/users/${userId}/roles`, {
        roleIds: [selectedRole.id],
      });
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      setShowAssignModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error("Failed to assign role:", error);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
              }}
            >
              Assign
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
            <div>
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Select Scopes:
              </div>
              <Stack spacing={1} sx={{ maxHeight: "200px", overflowY: "auto" }}>
                {scopes.map((scope) => (
                  <Button
                    key={scope.id}
                    onClick={() => handleScopeChange(scope.id, !selectedScopes.includes(scope.id))}
                    variant={selectedScopes.includes(scope.id) ? "contained" : "outlined"}
                    size="small"
                    fullWidth
                  >
                    {scope.name}
                  </Button>
                ))}
              </Stack>
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign {selectedRole?.name} to User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            <List sx={{ width: "100%" }}>
              {users.map((user) => {
                const hasRole = user.roles.some((r) => r.id === selectedRole?.id);
                return (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleAssignUser(user.id)}
                    selected={hasRole}
                  >
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
