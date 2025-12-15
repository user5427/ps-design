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
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  OutlinedInput,
  Alert,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/api/client";
import { useUsers } from "@/queries/users";
import { useRoles } from "@/queries/roles";
import { useAuthUser } from "@/hooks/auth";
import type { UserResponse, AssignRolesBody } from "@ps-design/schemas/user";

export function MyBusinessUsers() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Get current user info to determine their business
  const { data: currentUser } = useAuthUser();
  const businessId = currentUser?.businessId as string;

  // Fetch users for business
  const { data: users = [], isLoading: usersLoading } = useUsers(businessId);

  // Fetch roles for business
  const { data: roles = [], isLoading: rolesLoading } = useRoles(businessId);

  // Assign roles mutation
  const assignRolesMutation = useMutation({
    mutationFn: async ({
      userId,
      roleIds,
    }: {
      userId: string;
      roleIds: string[];
    }) => {
      const assignData: AssignRolesBody = { roleIds };
      const response = await api.post(`/users/${userId}/roles`, assignData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      queryClient.invalidateQueries({ queryKey: ["scopes"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = (user: UserResponse) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map((r) => r.id));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedRoleIds(typeof value === "string" ? value.split(",") : value);
  };

  const handleSubmit = () => {
    if (selectedUser) {
      assignRolesMutation.mutate({
        userId: selectedUser.id,
        roleIds: selectedRoleIds,
      });
    }
  };

  if (!businessId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">You are not associated with a business</Alert>
      </Box>
    );
  }

  if (usersLoading || rolesLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">My Business Users</Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user: UserResponse) => {
                  // Check if this is the current user
                  const isCurrentUser = currentUser?.id === user.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {user.roles.length > 0 ? (
                            user.roles.map((role: { id: string; name: string }) => (
                              <Chip
                                key={role.id}
                                label={role.name}
                                size="small"
                              />
                            ))
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              No roles assigned
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {/* Don't show edit action for current user */}
                        {!isCurrentUser && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Roles to {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={selectedRoleIds}
                onChange={handleRoleChange}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected: string[]) =>
                  roles
                    .filter((r: { id: string; name: string }) => selected.includes(r.id))
                    .map((r: { id: string; name: string }) => r.name)
                    .join(", ")
                }
              >
                {roles.map((role: { id: string; name: string; description?: string | null }) => (
                  <MenuItem key={role.id} value={role.id}>
                    <Box>
                      <Typography variant="body1">{role.name}</Typography>
                      {role.description && (
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={assignRolesMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
