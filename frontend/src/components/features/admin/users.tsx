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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/api/client";

interface User {
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
}

interface Business {
  id: string;
  name: string;
}

export function AdminUsersManagement() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  // Fetch all businesses
  const { data: businesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: async () => {
      const response = await api.get("/business");
      return response.data.data; // Assuming paginated response
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      password: string;
      businessId?: string;
      isOwner?: boolean;
    }) => {
      const response = await api.post("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEmail("");
    setName("");
    setPassword("");
    setSelectedBusinessId("");
    setIsOwner(false);
  };

  const handleSubmit = () => {
    createUserMutation.mutate({
      email,
      name,
      password,
      businessId: selectedBusinessId || undefined,
      isOwner,
    });
  };

  if (usersLoading || businessesLoading) {
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
            <Typography variant="h5">Admin Users Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create User
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Business</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.businessId ? (
                        businesses.find((b) => b.id === user.businessId)?.name || user.businessId
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No business
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Chip key={role.id} label={role.name} size="small" />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No roles
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              helperText="Minimum 8 characters"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Business (Optional)</InputLabel>
              <Select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                label="Business (Optional)"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {businesses.map((business) => (
                  <MenuItem key={business.id} value={business.id}>
                    {business.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedBusinessId && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOwner}
                    onChange={(e) => setIsOwner(e.target.checked)}
                  />
                }
                label="Make this user a business owner (grants OWNER role)"
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Note: User will be created without roles. Business owners can assign roles later, or
              check the "Make this user a business owner" option to automatically grant the OWNER role.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !email || !name || !password || password.length < 8 || createUserMutation.isPending
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
