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
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FormAlert } from "@/components/elements/form";
import { useCreateBusiness } from "@/queries/business";
import { URLS } from "@/constants/urls";

export const BusinessCreate: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const createMutation = useCreateBusiness();

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
      await createMutation.mutateAsync({ name });
      navigate({ to: URLS.BUSINESS_LIST });
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const handleCancel = () => {
    navigate({ to: URLS.BUSINESS_LIST });
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Business
        </Typography>

        {createMutation.isError && (
          <FormAlert
            message={
              createMutation.error instanceof Error
                ? createMutation.error.message
                : "Error creating business"
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
              disabled={createMutation.isPending}
            />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  "Create Business"
                )}
              </Button>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={handleCancel}
                disabled={createMutation.isPending}
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
