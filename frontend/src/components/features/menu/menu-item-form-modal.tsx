import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { FormAlert } from "@/components/elements/form";
import { getReadableError } from "@/utils/get-readable-error";
import type {
  CreateMenuItem,
  MenuItemCategory,
  MenuItem,
  UpdateMenuItem,
} from "@/schemas/menu";

interface Product {
  id: string;
  name: string;
}

interface BaseProductRecipe {
  productId: string;
  quantity: number;
}

interface VariationFormData {
  id?: string;
  name: string;
  type: string;
  priceAdjustment: number;
  isDisabled: boolean;
  addonProducts: BaseProductRecipe[];
}

interface MenuItemFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: MenuItem | null;
  categories: MenuItemCategory[];
  products: Product[];
  onSubmit: (data: CreateMenuItem | { id: string; data: UpdateMenuItem }) => Promise<void>;
  /** Called after successful submission */
  onSuccess?: () => void;
}

const emptyVariation = (): VariationFormData => ({
  name: "",
  type: "",
  priceAdjustment: 0,
  isDisabled: false,
  addonProducts: [],
});

const emptyRecipe = (): BaseProductRecipe => ({
  productId: "",
  quantity: 1,
});

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  open,
  onClose,
  mode,
  initialData,
  categories,
  products,
  onSubmit,
  onSuccess,
}) => {
  // Basic fields
  const [baseName, setBaseName] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);

  // Base products (recipes)
  const [baseProducts, setBaseProducts] = useState<BaseProductRecipe[]>([emptyRecipe()]);

  // Variations
  const [variations, setVariations] = useState<VariationFormData[]>([]);

  // State management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Collect all variation types in the current form for autocomplete
  const variationTypeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const v of variations) {
      if (v.type.trim()) {
        types.add(v.type.trim());
      }
    }
    return Array.from(types);
  }, [variations]);

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    [categories]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [products]
  );

  // Reset form when modal opens
  const reset = useCallback(() => {
    if (mode === "edit" && initialData) {
      setBaseName(initialData.baseName);
      setBasePrice(initialData.basePrice);
      setCategoryId(initialData.category?.id || null);
      setIsDisabled(initialData.isDisabled);
      setBaseProducts(
        initialData.baseProducts?.length
          ? initialData.baseProducts.map((bp) => ({
              productId: bp.product.id,
              quantity: bp.quantity,
            }))
          : [emptyRecipe()]
      );
      setVariations(
        initialData.variations?.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          priceAdjustment: v.priceAdjustment,
          isDisabled: v.isDisabled,
          addonProducts:
            v.addonProducts?.map((ap) => ({
              productId: ap.product.id,
              quantity: ap.quantity,
            })) || [],
        })) || []
      );
    } else {
      setBaseName("");
      setBasePrice("");
      setCategoryId(null);
      setIsDisabled(false);
      setBaseProducts([emptyRecipe()]);
      setVariations([]);
    }
    setErrors({});
    setSubmitError(null);
  }, [mode, initialData]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!baseName.trim()) {
      newErrors.baseName = "Name is required";
    } else if (baseName.length > 50) {
      newErrors.baseName = "Name must be at most 50 characters";
    }

    if (basePrice === "" || basePrice < 0) {
      newErrors.basePrice = "Base price is required and must be non-negative";
    }

    // Validate base products - at least one required with valid data
    const validBaseProducts = baseProducts.filter(
      (bp) => bp.productId && bp.quantity > 0
    );
    if (validBaseProducts.length === 0) {
      newErrors.baseProducts = "At least one base product is required";
    }

    // Validate variations
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.name.trim()) {
        newErrors[`variation_${i}_name`] = "Variation name is required";
      }
      if (!v.type.trim()) {
        newErrors[`variation_${i}_type`] = "Variation type is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Filter out empty base products
      const validBaseProducts = baseProducts.filter(
        (bp) => bp.productId && bp.quantity > 0
      );

      // Filter out empty variations and their addon products
      const validVariations = variations
        .filter((v) => v.name.trim() && v.type.trim())
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          type: v.type.trim().toUpperCase() as "SIZE" | "FLAVOR" | "ADDON",
          priceAdjustment: v.priceAdjustment,
          isDisabled: v.isDisabled,
          addonProducts: v.addonProducts.filter(
            (ap) => ap.productId && ap.quantity > 0
          ),
        }));

      if (mode === "create") {
        const createData: CreateMenuItem = {
          baseName: baseName.trim(),
          basePrice: Number(basePrice),
          categoryId: categoryId || null,
          isDisabled,
          baseProducts: validBaseProducts,
          variations: validVariations,
        };
        await onSubmit(createData);
      } else if (initialData) {
        const updateData: UpdateMenuItem = {
          baseName: baseName.trim(),
          basePrice: Number(basePrice),
          categoryId: categoryId || null,
          isDisabled,
          baseProducts: validBaseProducts,
          variations: validVariations,
        };
        await onSubmit({ id: initialData.id, data: updateData });
      }

      onClose();
      reset();
      onSuccess?.();
    } catch (err) {
      setSubmitError(getReadableError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base product handlers
  const handleAddBaseProduct = () => {
    setBaseProducts([...baseProducts, emptyRecipe()]);
  };

  const handleRemoveBaseProduct = (index: number) => {
    if (baseProducts.length > 1) {
      setBaseProducts(baseProducts.filter((_, i) => i !== index));
    }
  };

  const handleBaseProductChange = (
    index: number,
    field: "productId" | "quantity",
    value: string | number
  ) => {
    const updated = [...baseProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBaseProducts(updated);
    // Clear error when user makes changes
    if (errors.baseProducts) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.baseProducts;
        return newErrors;
      });
    }
  };

  // Variation handlers
  const handleAddVariation = () => {
    setVariations([...variations, emptyVariation()]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (
    index: number,
    field: keyof VariationFormData,
    value: unknown
  ) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
    // Clear field-specific error
    const errorKey = `variation_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Addon product handlers for variations
  const handleAddAddonProduct = (variationIndex: number) => {
    const updated = [...variations];
    updated[variationIndex] = {
      ...updated[variationIndex],
      addonProducts: [...updated[variationIndex].addonProducts, emptyRecipe()],
    };
    setVariations(updated);
  };

  const handleRemoveAddonProduct = (
    variationIndex: number,
    addonIndex: number
  ) => {
    const updated = [...variations];
    updated[variationIndex] = {
      ...updated[variationIndex],
      addonProducts: updated[variationIndex].addonProducts.filter(
        (_, i) => i !== addonIndex
      ),
    };
    setVariations(updated);
  };

  const handleAddonProductChange = (
    variationIndex: number,
    addonIndex: number,
    field: "productId" | "quantity",
    value: string | number
  ) => {
    const updated = [...variations];
    const addonProducts = [...updated[variationIndex].addonProducts];
    addonProducts[addonIndex] = { ...addonProducts[addonIndex], [field]: value };
    updated[variationIndex] = { ...updated[variationIndex], addonProducts };
    setVariations(updated);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Create Menu Item" : "Edit Menu Item"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            {submitError && <FormAlert message={submitError} severity="error" />}

            {/* Basic Information Section */}
            <Typography variant="subtitle1" fontWeight="bold">
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Name"
                value={baseName}
                onChange={(e) => {
                  setBaseName(e.target.value);
                  if (errors.baseName) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.baseName;
                      return newErrors;
                    });
                  }
                }}
                error={!!errors.baseName}
                helperText={errors.baseName}
                disabled={isSubmitting}
                required
              />

              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={basePrice}
                onChange={(e) => {
                  setBasePrice(e.target.value === "" ? "" : Number(e.target.value));
                  if (errors.basePrice) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.basePrice;
                      return newErrors;
                    });
                  }
                }}
                error={!!errors.basePrice}
                helperText={errors.basePrice}
                disabled={isSubmitting}
                required
                slotProps={{
                  input: {
                    inputProps: { min: 0, step: 0.01 },
                  },
                }}
              />

              <Autocomplete
                options={categoryOptions}
                getOptionLabel={(option) => option.label}
                value={categoryOptions.find((o) => o.value === categoryId) || null}
                onChange={(_, newValue) => setCategoryId(newValue?.value || null)}
                disabled={isSubmitting}
                renderInput={(params) => (
                  <TextField {...params} label="Category" placeholder="Select category..." />
                )}
                isOptionEqualToValue={(option, val) => option.value === val.value}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDisabled}
                    onChange={(e) => setIsDisabled(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Disabled"
              />
            </Stack>

            <Divider />

            {/* Base Products (Recipes) Section */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Base Products (Recipe) *
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddBaseProduct}
                  disabled={isSubmitting}
                >
                  Add Product
                </Button>
              </Stack>
              {errors.baseProducts && (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  {errors.baseProducts}
                </Typography>
              )}
              <Stack spacing={2}>
                {baseProducts.map((bp, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Autocomplete
                        sx={{ flex: 2 }}
                        options={productOptions}
                        getOptionLabel={(option) => option.label}
                        value={productOptions.find((o) => o.value === bp.productId) || null}
                        onChange={(_, newValue) =>
                          handleBaseProductChange(index, "productId", newValue?.value || "")
                        }
                        disabled={isSubmitting}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Product"
                            placeholder="Select product..."
                            required
                          />
                        )}
                        isOptionEqualToValue={(option, val) => option.value === val.value}
                      />
                      <TextField
                        sx={{ flex: 1 }}
                        label="Quantity"
                        type="number"
                        value={bp.quantity}
                        onChange={(e) =>
                          handleBaseProductChange(index, "quantity", Number(e.target.value))
                        }
                        disabled={isSubmitting}
                        required
                        slotProps={{
                          input: {
                            inputProps: { min: 0.01, step: 0.01 },
                          },
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveBaseProduct(index)}
                        disabled={isSubmitting || baseProducts.length === 1}
                        color="error"
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Variations Section */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Variations (Optional)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariation}
                  disabled={isSubmitting}
                >
                  Add Variation
                </Button>
              </Stack>

              {variations.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No variations added. Click "Add Variation" to create size, flavor, or addon
                  options.
                </Typography>
              ) : (
                <Stack spacing={3}>
                  {variations.map((variation, vIndex) => (
                    <Paper key={vIndex} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">Variation {vIndex + 1}</Typography>
                          <IconButton
                            onClick={() => handleRemoveVariation(vIndex)}
                            disabled={isSubmitting}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                          <TextField
                            sx={{ flex: 1 }}
                            label="Name"
                            value={variation.name}
                            onChange={(e) =>
                              handleVariationChange(vIndex, "name", e.target.value)
                            }
                            error={!!errors[`variation_${vIndex}_name`]}
                            helperText={errors[`variation_${vIndex}_name`]}
                            disabled={isSubmitting}
                            required
                          />

                          <Autocomplete
                            sx={{ flex: 1 }}
                            freeSolo
                            options={variationTypeOptions}
                            value={variation.type}
                            onInputChange={(_, newValue) =>
                              handleVariationChange(vIndex, "type", newValue)
                            }
                            disabled={isSubmitting}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Type"
                                placeholder="e.g., SIZE, FLAVOR, ADDON"
                                error={!!errors[`variation_${vIndex}_type`]}
                                helperText={
                                  errors[`variation_${vIndex}_type`] ||
                                  "Type a new type or select from existing"
                                }
                                required
                              />
                            )}
                          />
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField
                            sx={{ flex: 1 }}
                            label="Price Adjustment"
                            type="number"
                            value={variation.priceAdjustment}
                            onChange={(e) =>
                              handleVariationChange(
                                vIndex,
                                "priceAdjustment",
                                Number(e.target.value)
                              )
                            }
                            disabled={isSubmitting}
                            slotProps={{
                              input: {
                                inputProps: { step: 0.01 },
                              },
                            }}
                            helperText="Can be negative or positive"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={variation.isDisabled}
                                onChange={(e) =>
                                  handleVariationChange(vIndex, "isDisabled", e.target.checked)
                                }
                                disabled={isSubmitting}
                              />
                            }
                            label="Disabled"
                          />
                        </Stack>

                        {/* Addon Products for this variation */}
                        <Box sx={{ pl: 2, borderLeft: 2, borderColor: "divider" }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              Addon Products (Optional)
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddAddonProduct(vIndex)}
                              disabled={isSubmitting}
                            >
                              Add
                            </Button>
                          </Stack>

                          {variation.addonProducts.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              No addon products for this variation.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {variation.addonProducts.map((addon, aIndex) => (
                                <Stack key={aIndex} direction="row" spacing={1} alignItems="center">
                                  <Autocomplete
                                    sx={{ flex: 2 }}
                                    size="small"
                                    options={productOptions}
                                    getOptionLabel={(option) => option.label}
                                    value={
                                      productOptions.find((o) => o.value === addon.productId) ||
                                      null
                                    }
                                    onChange={(_, newValue) =>
                                      handleAddonProductChange(
                                        vIndex,
                                        aIndex,
                                        "productId",
                                        newValue?.value || ""
                                      )
                                    }
                                    disabled={isSubmitting}
                                    renderInput={(params) => (
                                      <TextField {...params} label="Product" size="small" />
                                    )}
                                    isOptionEqualToValue={(option, val) =>
                                      option.value === val.value
                                    }
                                  />
                                  <TextField
                                    sx={{ flex: 1 }}
                                    size="small"
                                    label="Qty"
                                    type="number"
                                    value={addon.quantity}
                                    onChange={(e) =>
                                      handleAddonProductChange(
                                        vIndex,
                                        aIndex,
                                        "quantity",
                                        Number(e.target.value)
                                      )
                                    }
                                    disabled={isSubmitting}
                                    slotProps={{
                                      input: {
                                        inputProps: { min: 0.01, step: 0.01 },
                                      },
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveAddonProduct(vIndex, aIndex)}
                                    disabled={isSubmitting}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
