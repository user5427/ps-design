import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FormAlert } from "@/components/elements/form";
import { useBusinessById, useUpdateBusiness } from "@/queries/business";
import { URLS } from "@/constants/urls";

export const BusinessEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams({ from: "/businesses/$businessId/edit" });
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const { data: business, isLoading: isLoadingBusiness } = useBusinessById(
    params.businessId,
  );
  const updateMutation = useUpdateBusiness(params.businessId);

  useEffect(() => {
    if (business) {
      setName(business.name);
    }
  }, [business]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError("Business name is required");
      isValid = false;
    } else if (name.length < 1 || name.length > 100) {
      setNameError("Business name must be between 1 and 100 characters");
      isValid = false;
    } else {
      setNameError("");
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ name });
      navigate({ to: URLS.MANAGE_BUSINESSES });
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleCancel = () => {
    navigate({ to: URLS.MANAGE_BUSINESSES });
  };

  if (isLoadingBusiness) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Business
        </Typography>

        {updateMutation.isError && (
          <FormAlert
            message={
              updateMutation.error instanceof Error
                ? updateMutation.error.message
                : "Error updating business"
            }
            severity="error"
          />
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Business Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) {
                  setNameError("");
                }
              }}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              required
              placeholder="Enter business name"
              disabled={updateMutation.isPending}
            />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  "Update Business"
                )}
              </Button>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};
