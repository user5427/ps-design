import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/api/client";

interface Role {
  id: string;
  name: string;
  description: string | null;
  businessId: string;
  isSystemRole: boolean;
  isDeletable: boolean;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

interface Scope {
  name: string;
  description: string;
}

interface BusinessRolesManagementProps {
  businessId: string;
}

export function BusinessRolesManagement({ businessId }: BusinessRolesManagementProps) {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Fetch roles for business
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["roles", businessId],
    queryFn: async () => {
      const response = await api.get(`/roles?businessId=${businessId}`);
      return response.data;
    },
  });

  // Fetch available scopes
  const { data: scopes = [], isLoading: scopesLoading } = useQuery<Scope[]>({
    queryKey: ["scopes"],
    queryFn: async () => {
      const response = await api.get("/roles/scopes");
      return response.data;
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; businessId: string; scopes: string[] }) => {
      const response = await api.post("/roles", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
      handleCloseDialog();
    },
  });

  // Update role scopes mutation
  const updateRoleScopesMutation = useMutation({
    mutationFn: async ({ roleId, scopes }: { roleId: string; scopes: string[] }) => {
      const response = await api.post(`/roles/${roleId}/scopes`, { scopes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
      handleCloseDialog();
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", businessId] });
    },
  });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setSelectedScopes(role.scopes);
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleDescription("");
      setSelectedScopes([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedScopes([]);
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateRoleScopesMutation.mutate({
        roleId: editingRole.id,
        scopes: selectedScopes,
      });
    } else {
      createRoleMutation.mutate({
        name: roleName,
        description: roleDescription,
        businessId,
        scopes: selectedScopes,
      });
    }
  };

  const handleToggleScope = (scopeName: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeName)
        ? prev.filter((s) => s !== scopeName)
        : [...prev, scopeName]
    );
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  if (rolesLoading || scopesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Roles Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Role
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Scopes</TableCell>
                  <TableCell>System Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {role.scopes.map((scope) => (
                          <Chip key={scope} label={scope} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {role.isSystemRole ? (
                        <Chip label="System" color="primary" size="small" />
                      ) : (
                        <Chip label="Custom" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(role)}
                        disabled={role.isSystemRole}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={!role.isDeletable}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? "Edit Role Scopes" : "Create New Role"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {!editingRole && (
              <>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </>
            )}

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Assign Scopes
            </Typography>
            <FormGroup>
              {scopes.map((scope) => (
                <FormControlLabel
                  key={scope.name}
                  control={
                    <Checkbox
                      checked={selectedScopes.includes(scope.name)}
                      onChange={() => handleToggleScope(scope.name)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{scope.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {scope.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              (!editingRole && !roleName) ||
              selectedScopes.length === 0 ||
              createRoleMutation.isPending ||
              updateRoleScopesMutation.isPending
            }
          >
            {editingRole ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
