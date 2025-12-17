import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from "@mui/material";
import { useAuthUser } from "@/hooks/auth";
import { useBusinessById, useUpdateBusiness } from "@/queries/business";
import type { UpdateBusinessBody } from "@ps-design/schemas/business";

export function BusinessInfoManagement() {
  const { data: currentUser } = useAuthUser();
  const businessId = currentUser?.businessId;

  const {
    data: business,
    isLoading,
    error,
  } = useBusinessById(businessId || "");
  const updateMutation = useUpdateBusiness(businessId || "");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!businessId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You must be associated with a business to view this page.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load business information</Alert>
      </Box>
    );
  }

  if (!business) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Business not found</Alert>
      </Box>
    );
  }

  const handleEditClick = () => {
    setFormData({
      name: business.name || "",
      email: business.email || "",
      phone: business.phone || "",
      address: business.address || "",
    });
    setIsEditing(true);
    setFormErrors({});
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = "Name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be at most 100 characters";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }

    if (formData.phone && !/^[\d\s()+-]+$/.test(formData.phone)) {
      errors.phone = "Phone number can only contain digits, spaces, and +()-";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updateData: UpdateBusinessBody = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      await updateMutation.mutateAsync(updateData);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update business:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Business Information
      </Typography>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update business information
        </Alert>
      )}

      {updateMutation.isSuccess && !isEditing && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Business information updated successfully
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
              >
                Business Type
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {business.isOrderBased && (
                  <Chip label="Order Based" color="primary" size="small" />
                )}
                {business.isAppointmentBased && (
                  <Chip
                    label="Appointment Based"
                    color="secondary"
                    size="small"
                  />
                )}
                {!business.isOrderBased && !business.isAppointmentBased && (
                  <Typography variant="body2" color="text.secondary">
                    No business type assigned
                  </Typography>
                )}
              </Box>
            </Box>
            <TextField
              label="Business Name"
              value={isEditing ? formData.name : business.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={!isEditing}
              required
              fullWidth
              error={!!formErrors.name}
              helperText={formErrors.name}
            />

            <TextField
              label="Email"
              type="email"
              value={isEditing ? formData.email : business.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
            />

            <TextField
              label="Phone"
              value={isEditing ? formData.phone : business.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={!isEditing}
              fullWidth
              error={!!formErrors.phone}
              helperText={
                formErrors.phone || "Use format: +1234567890 or (123) 456-7890"
              }
            />

            <TextField
              label="Address"
              value={isEditing ? formData.address : business.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isEditing}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              {!isEditing ? (
                <Button variant="contained" onClick={handleEditClick}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCancelClick}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveClick}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
