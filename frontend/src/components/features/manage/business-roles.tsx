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
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Box,
  Alert,
  Stack,
} from "@mui/material";

type Role = Record<string, unknown> & {
  id: string;
  name: string;
  description: string | null;
  businessId: string | null;
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
    for (const id of ids) {
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

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowRoleModal(true)}
          >
            Create Role
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              if (selectedRole && Object.keys(selectedRole).length > 0) {
                setShowAssignModal(true);
              }
            }}
            disabled={!selectedRole || Object.keys(selectedRole).length === 0}
          >
            Assign to User
          </Button>
        </Stack>

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
              <FormGroup>
                {scopes.map((scope) => (
                  <FormControlLabel
                    key={scope.id}
                    control={
                      <Checkbox
                        checked={selectedScopes.includes(scope.id)}
                        onChange={(e) => handleScopeChange(scope.id, e.target.checked)}
                      />
                    }
                    label={`${scope.name}${scope.description ? ` - ${scope.description}` : ""}`}
                  />
                ))}
              </FormGroup>
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
        <DialogTitle>Assign Role to Users</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            {users.map((user) => (
              <FormControlLabel
                key={user.id}
                control={
                  <Checkbox
                    checked={user.roles.some((r) => r.id === selectedRole?.id)}
                    onChange={async (e) => {
                      if (e.target.checked && selectedRole) {
                        await apiClient.post(`/users/${user.id}/roles`, {
                          roleIds: [selectedRole.id],
                        });
                      } else if (!e.target.checked && selectedRole) {
                        await apiClient.delete(
                          `/users/${user.id}/roles/${selectedRole.id}`
                        );
                      }
                      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
                    }}
                  />
                }
                label={`${user.name} (${user.email})`}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
