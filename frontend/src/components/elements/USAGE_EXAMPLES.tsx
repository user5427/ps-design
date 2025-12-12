/**
 * PROPER ARCHITECTURE PATTERN
 * 
 * Separation of Concerns:
 * 1. FormBuilder = Just a dumb modal wrapper with form submission
 * 2. ListManager = Just a state manager (which modal is open, which record is selected)
 * 3. Forms = Built independently as constants and passed to ListManager/FormBuilder
 * 
 * This gives you MAXIMUM FLEXIBILITY
 */

import type React from "react";
import {
  FormBuilder,
  FormText,
  FormNumber,
  FormSelect,
  FormTextarea,
  ListManager,
} from "@/components/elements";
import type { EntityMapping } from "@ps-design/utils";

// ============================================================================
// STEP 1: Define your forms as separate, reusable constants
// ============================================================================

/**
 * This is NOT a component - it's a function that takes a form object.
 * You can build these in separate files, import them, reuse them, etc.
 */
export const productFormSchema: (form: any) => React.ReactNode = (form) => (
  <>
    {/* Text field with custom validation */}
    <form.Field
      name="name"
      defaultValue=""
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (!value) return "Name is required";
          if (String(value).length < 3) return "Name must be at least 3 characters";
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormText
          fieldName="name"
          label="Product Name"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          required
        />
      )}
    </form.Field>

    {/* Number field */}
    <form.Field
      name="price"
      defaultValue={0}
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (value === 0 || !value) return "Price is required";
          if (Number(value) <= 0) return "Price must be greater than 0";
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormNumber
          fieldName="price"
          label="Price"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          required
        />
      )}
    </form.Field>

    {/* Select field */}
    <form.Field
      name="category"
      defaultValue=""
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (!value) return "Category is required";
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormSelect
          fieldName="category"
          label="Category"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          required
          options={[
            { id: "electronics", label: "Electronics" },
            { id: "clothing", label: "Clothing" },
            { id: "food", label: "Food" },
          ]}
        />
      )}
    </form.Field>

    {/* Textarea field */}
    <form.Field
      name="description"
      defaultValue=""
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          if (String(value).length > 500) return "Description must be less than 500 characters";
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormTextarea
          fieldName="description"
          label="Description"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          rows={4}
        />
      )}
    </form.Field>
  </>
);

// ============================================================================
// STEP 2: Define your entity mapping
// ============================================================================

export const productMapping: EntityMapping = {
  displayName: "Products",
  endpoint: "/products",
  fields: [
    { key: "id", label: "ID", type: "string", sortable: true, filterable: false },
    { key: "name", label: "Product Name", type: "string", sortable: true, filterable: true },
    { key: "price", label: "Price", type: "number", sortable: true, filterable: false },
    { key: "category", label: "Category", type: "string", sortable: true, filterable: true },
    {
      key: "description",
      label: "Description",
      type: "string",
      sortable: false,
      filterable: false,
    },
  ],
};

// ============================================================================
// STEP 3: Use ListManager with your pre-built forms
// ============================================================================

export function ProductListExample() {
  return (
    <ListManager
      mapping={productMapping}
      createForm={productFormSchema} // <-- Pass your pre-built form here
      editForm={productFormSchema} // <-- Same form for edit (ListManager will set initial values)
      onCreate={async (values) => {
        // Your API call
        // const response = await api.post("/products", values);
        console.log("Creating product:", values);
      }}
      onEdit={async (id, values) => {
        // Your API call
        // const response = await api.patch(`/products/${id}`, values);
        console.log(`Updating product ${id}:`, values);
      }}
      onDelete={async (ids) => {
        // Your API call
        // await api.delete("/products", { data: { ids } });
        console.log("Deleting products:", ids);
      }}
      onSuccess={() => {
        // Optional: Called after successful operation
        console.log("Operation completed!");
      }}
    />
  );
}

// ============================================================================
// STEP 4 (Optional): Use FormBuilder directly if you want full control
// ============================================================================

export function DirectFormBuilderExample() {
  return (
    <FormBuilder
      open={true}
      onClose={() => {}}
      title="Create Product"
      initialValues={{ name: "", price: 0, category: "", description: "" }}
      onSubmit={async (values) => {
        console.log("Form submitted:", values);
      }}
    >
      {/* Pass your form schema here */}
      {productFormSchema}
    </FormBuilder>
  );
}
