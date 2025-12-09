import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  TablePagination,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MainLayout } from "@/components/layouts";
import { FormAlert, ConfirmationDialog } from "@/components/elements/form";
import {
  useBusinessesPaginated,
  useDeleteBusiness,
} from "@/queries/business";
import { URLS } from "@/constants/urls";

export const BusinessListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError, error } = useBusinessesPaginated(
    page,
    limit,
    search || undefined,
  );

  const deleteMutation = useDeleteBusiness();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage + 1); // MUI uses 0-based indexing
  };

  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handleEditClick = (businessId: string) => {
    navigate({
      to: "/businesses/$businessId/edit",
      params: { businessId },
    });
  };

  const handleDeleteClick = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedBusinessId) {
      try {
        await deleteMutation.mutateAsync(selectedBusinessId);
        setDeleteDialogOpen(false);
        setSelectedBusinessId(null);
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedBusinessId(null);
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h4">View Businesses</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate({ to: URLS.BUSINESS_CREATE })}
            >
              Create Business
            </Button>
          </Box>

          <TextField
            placeholder="Search businesses by name..."
            variant="outlined"
            fullWidth
            value={search}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />

          {isError && (
            <FormAlert
              message={
                error instanceof Error ? error.message : "Error loading businesses"
              }
              severity="error"
            />
          )}

          {deleteMutation.isError && (
            <FormAlert
              message={
                deleteMutation.error instanceof Error
                  ? deleteMutation.error.message
                  : "Error deleting business"
              }
              severity="error"
            />
          )}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Created At
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Updated At
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.items && data.items.length > 0 ? (
                      data.items.map((business) => (
                        <TableRow key={business.id} hover>
                          <TableCell>{business.name}</TableCell>
                          <TableCell>
                            {new Date(business.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(business.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(business.id)}
                              title="Edit"
                              disabled={deleteMutation.isPending}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(business.id)}
                              title="Delete"
                              disabled={deleteMutation.isPending}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          No businesses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {data && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={data.total}
                  rowsPerPage={limit}
                  page={page - 1} // MUI uses 0-based indexing
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              )}
            </>
          )}
        </Stack>
      </Container>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Business?"
        description="Are you sure you want to delete this business? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </MainLayout>
  );
};
