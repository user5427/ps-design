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
import type { Product } from "@/schemas/inventory";

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

const useMenuItemForm = ({
  mode,
  initialData,
  onSubmit,
  onSuccess,
  onClose,
}: Pick<MenuItemFormModalProps, "mode" | "initialData" | "onSubmit" | "onSuccess" | "onClose">) => {
  const [baseName, setBaseName] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [baseProducts, setBaseProducts] = useState<BaseProductRecipe[]>([emptyRecipe()]);
  const [variations, setVariations] = useState<VariationFormData[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  useEffect(() => {
    reset();
  }, [reset]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!baseName.trim()) newErrors.baseName = "Name is required";
    else if (baseName.length > 50) newErrors.baseName = "Name must be at most 50 characters";

    if (basePrice === "" || basePrice < 0)
      newErrors.basePrice = "Base price is required and must be non-negative";

    const validBaseProducts = baseProducts.filter((bp) => bp.productId && bp.quantity > 0);
    if (validBaseProducts.length === 0)
      newErrors.baseProducts = "At least one base product is required";

    variations.forEach((v, i) => {
      if (!v.name.trim()) newErrors[`variation_${i}_name`] = "Variation name is required";
      if (!v.type.trim()) newErrors[`variation_${i}_type`] = "Variation type is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const validBaseProducts = baseProducts.filter((bp) => bp.productId && bp.quantity > 0);
      const validVariations = variations
        .filter((v) => v.name.trim() && v.type.trim())
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          type: v.type.trim().toUpperCase(),
          priceAdjustment: v.priceAdjustment,
          isDisabled: v.isDisabled,
          addonProducts: v.addonProducts.filter((ap) => ap.productId && ap.quantity > 0),
        }));

      const commonData = {
        baseName: baseName.trim(),
        basePrice: Number(basePrice),
        categoryId: categoryId || null,
        isDisabled,
        baseProducts: validBaseProducts,
        variations: validVariations,
      };

      if (mode === "create") {
        await onSubmit(commonData as CreateMenuItem);
      } else if (initialData) {
        await onSubmit({ id: initialData.id, data: commonData as UpdateMenuItem });
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

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
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
    clearError("baseProducts");
  };

  const handleVariationChange = (
    index: number,
    field: keyof VariationFormData,
    value: unknown
  ) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
    clearError(`variation_${index}_${field}`);
  };

  const handleAddonProductChange = (
    vIndex: number,
    aIndex: number,
    field: "productId" | "quantity",
    value: string | number
  ) => {
    const updated = [...variations];
    const addonProducts = [...updated[vIndex].addonProducts];
    addonProducts[aIndex] = { ...addonProducts[aIndex], [field]: value };
    updated[vIndex] = { ...updated[vIndex], addonProducts };
    setVariations(updated);
  };

  return {
    formState: { baseName, basePrice, categoryId, isDisabled, baseProducts, variations },
    setters: { setBaseName, setBasePrice, setCategoryId, setIsDisabled },
    handlers: {
      handleAddBaseProduct: () => setBaseProducts([...baseProducts, emptyRecipe()]),
      handleRemoveBaseProduct: (i: number) =>
        baseProducts.length > 1 && setBaseProducts(baseProducts.filter((_, idx) => idx !== i)),
      handleBaseProductChange,
      handleAddVariation: () => setVariations([...variations, emptyVariation()]),
      handleRemoveVariation: (i: number) => setVariations(variations.filter((_, idx) => idx !== i)),
      handleVariationChange,
      handleAddAddonProduct: (i: number) => {
        const updated = [...variations];
        updated[i].addonProducts.push(emptyRecipe());
        setVariations(updated);
      },
      handleRemoveAddonProduct: (vIndex: number, aIndex: number) => {
        const updated = [...variations];
        updated[vIndex].addonProducts = updated[vIndex].addonProducts.filter(
          (_, i) => i !== aIndex
        );
        setVariations(updated);
      },
      handleAddonProductChange,
      clearError,
    },
    status: { errors, isSubmitting, submitError },
    handleSubmit,
    reset,
  };
};

const BasicInfoSection: React.FC<{
  baseName: string;
  basePrice: number | "";
  categoryId: string | null;
  isDisabled: boolean;
  categories: MenuItemCategory[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  onNameChange: (val: string) => void;
  onPriceChange: (val: number | "") => void;
  onCategoryChange: (val: string | null) => void;
  onDisabledChange: (val: boolean) => void;
}> = ({
  baseName,
  basePrice,
  categoryId,
  isDisabled,
  categories,
  errors,
  isSubmitting,
  onNameChange,
  onPriceChange,
  onCategoryChange,
  onDisabledChange,
}) => {
  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight="bold">
        Basic Information
      </Typography>
      <TextField
        fullWidth
        label="Name"
        value={baseName}
        onChange={(e) => onNameChange(e.target.value)}
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
        onChange={(e) => onPriceChange(e.target.value === "" ? "" : Number(e.target.value))}
        error={!!errors.basePrice}
        helperText={errors.basePrice}
        disabled={isSubmitting}
        required
        slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
      />
      <Autocomplete
        options={categoryOptions}
        getOptionLabel={(option) => option.label}
        value={categoryOptions.find((o) => o.value === categoryId) || null}
        onChange={(_, newValue) => onCategoryChange(newValue?.value || null)}
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
            onChange={(e) => onDisabledChange(e.target.checked)}
            disabled={isSubmitting}
          />
        }
        label="Disabled"
      />
    </Stack>
  );
};

const BaseProductsSection: React.FC<{
  baseProducts: BaseProductRecipe[];
  products: Product[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: "productId" | "quantity", value: string | number) => void;
  getProductUnit: (id: string) => string;
}> = ({
  baseProducts,
  products,
  errors,
  isSubmitting,
  onAdd,
  onRemove,
  onChange,
  getProductUnit,
}) => {
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Base Products (Recipe) *
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
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
                onChange={(_, newValue) => onChange(index, "productId", newValue?.value || "")}
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
                onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
                disabled={isSubmitting}
                required
                slotProps={{
                  input: {
                    inputProps: { min: 0.01, step: 0.01 },
                    endAdornment: bp.productId ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {getProductUnit(bp.productId)}
                      </Typography>
                    ) : null,
                  },
                }}
              />
              <IconButton
                onClick={() => onRemove(index)}
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
  );
};

const VariationsSection: React.FC<{
  variations: VariationFormData[];
  products: Product[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof VariationFormData, value: unknown) => void;
  onAddAddon: (index: number) => void;
  onRemoveAddon: (vIndex: number, aIndex: number) => void;
  onChangeAddon: (
    vIndex: number,
    aIndex: number,
    field: "productId" | "quantity",
    value: string | number
  ) => void;
  getProductUnit: (id: string) => string;
}> = ({
  variations,
  products,
  errors,
  isSubmitting,
  onAdd,
  onRemove,
  onChange,
  onAddAddon,
  onRemoveAddon,
  onChangeAddon,
  getProductUnit,
}) => {
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const variationTypeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const v of variations) {
      if (v.type.trim()) types.add(v.type.trim());
    }
    return Array.from(types);
  }, [variations]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Variations (Optional)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          disabled={isSubmitting}
        >
          Add Variation
        </Button>
      </Stack>

      {variations.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No variations added. Click "Add Variation" to create.
        </Typography>
      ) : (
        <Stack spacing={3}>
          {variations.map((variation, vIndex) => (
            <Paper key={vIndex} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">Variation {vIndex + 1}</Typography>
                  <IconButton
                    onClick={() => onRemove(vIndex)}
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
                    onChange={(e) => onChange(vIndex, "name", e.target.value)}
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
                    onInputChange={(_, newValue) => onChange(vIndex, "type", newValue)}
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
                    onChange={(e) => onChange(vIndex, "priceAdjustment", Number(e.target.value))}
                    disabled={isSubmitting}
                    slotProps={{ input: { inputProps: { step: 0.01 } } }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={variation.isDisabled}
                        onChange={(e) => onChange(vIndex, "isDisabled", e.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label="Disabled"
                  />
                </Stack>

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
                      onClick={() => onAddAddon(vIndex)}
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
                              productOptions.find((o) => o.value === addon.productId) || null
                            }
                            onChange={(_, newValue) =>
                              onChangeAddon(vIndex, aIndex, "productId", newValue?.value || "")
                            }
                            disabled={isSubmitting}
                            renderInput={(params) => (
                              <TextField {...params} label="Product" size="small" />
                            )}
                            isOptionEqualToValue={(option, val) => option.value === val.value}
                          />
                          <TextField
                            sx={{ flex: 1 }}
                            size="small"
                            label="Qty"
                            type="number"
                            value={addon.quantity}
                            onChange={(e) =>
                              onChangeAddon(vIndex, aIndex, "quantity", Number(e.target.value))
                            }
                            disabled={isSubmitting}
                            slotProps={{
                              input: {
                                inputProps: { min: 0.01, step: 0.01 },
                                endAdornment: addon.productId ? (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                    {getProductUnit(addon.productId)}
                                  </Typography>
                                ) : null,
                              },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => onRemoveAddon(vIndex, aIndex)}
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
  );
};

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = (props) => {
  const {
    formState,
    setters,
    handlers,
    status,
    handleSubmit,
  } = useMenuItemForm(props);

  const { open, onClose, mode, categories, products } = props;

  const getProductUnit = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return "";
      return product.productUnit.symbol || product.productUnit.name;
    },
    [products]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Create Menu Item" : "Edit Menu Item"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            {status.submitError && <FormAlert message={status.submitError} severity="error" />}

            <BasicInfoSection
              baseName={formState.baseName}
              basePrice={formState.basePrice}
              categoryId={formState.categoryId}
              isDisabled={formState.isDisabled}
              categories={categories}
              errors={status.errors}
              isSubmitting={status.isSubmitting}
              onNameChange={(val) => {
                setters.setBaseName(val);
                handlers.clearError("baseName");
              }}
              onPriceChange={(val) => {
                setters.setBasePrice(val);
                handlers.clearError("basePrice");
              }}
              onCategoryChange={setters.setCategoryId}
              onDisabledChange={setters.setIsDisabled}
            />

            <Divider />

            <BaseProductsSection
              baseProducts={formState.baseProducts}
              products={products}
              errors={status.errors}
              isSubmitting={status.isSubmitting}
              onAdd={handlers.handleAddBaseProduct}
              onRemove={handlers.handleRemoveBaseProduct}
              onChange={handlers.handleBaseProductChange}
              getProductUnit={getProductUnit}
            />

            <Divider />

            <VariationsSection
              variations={formState.variations}
              products={products}
              errors={status.errors}
              isSubmitting={status.isSubmitting}
              onAdd={handlers.handleAddVariation}
              onRemove={handlers.handleRemoveVariation}
              onChange={handlers.handleVariationChange}
              onAddAddon={handlers.handleAddAddonProduct}
              onRemoveAddon={handlers.handleRemoveAddonProduct}
              onChangeAddon={handlers.handleAddonProductChange}
              getProductUnit={getProductUnit}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={status.isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={status.isSubmitting}
            startIcon={status.isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
