/**
 * Example: Using createForm to build forms for ListManager
 * 
 * createForm returns { ref, Component } - everything you need
 * for ListManager. The form handles all its own logic and state.
 */

import { createForm } from "../form-builder";
import { FormText, FormNumber } from "../form-builder/form-elements";
import { ListManager } from "./list-manager";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";

// Create form using createForm()
const createProductForm = createForm({
  title: "Create Product",
  children: (form: any) => (
    <>
      <form.Field
        name="name"
        defaultValue=""
        validators={{
          onChange: ({ value }) => {
            if (!value || String(value).trim().length === 0) {
              return "Name is required";
            }
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
            type="text"
            required
          />
        )}
      </form.Field>

      <form.Field
        name="price"
        defaultValue={0}
        validators={{
          onChange: ({ value }) => {
            if (!value || Number(value) <= 0) {
              return "Price must be greater than 0";
            }
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
            type="number"
            required
          />
        )}
      </form.Field>
    </>
  ),
  onSubmit: async (values) => {
    // All your logic here - API calls, etc
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error("Failed to create product");
  },
});

const editProductForm = createForm({
  title: "Edit Product",
  submitLabel: "Update",
  children: (form: any) => (
    <>
      <form.Field
        name="name"
        defaultValue=""
        validators={{
          onChange: ({ value }: any) => {
            if (!value || String(value).trim().length === 0) {
              return "Name is required";
            }
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
            type="text"
            required
          />
        )}
      </form.Field>

      <form.Field
        name="price"
        defaultValue={0}
        validators={{
          onChange: ({ value }: any) => {
            if (!value || Number(value) <= 0) {
              return "Price must be greater than 0";
            }
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
            type="number"
            required
          />
        )}
      </form.Field>
    </>
  ),
  onSubmit: async (values: any, record: any) => {
    // record is populated when editing
    if (!record?.id) throw new Error("No product ID");
    
    const response = await fetch(`/api/products/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error("Failed to update product");
  },
});

/**
 * Usage Example Component
 */
export function ProductListExample() {
  return (
    <>
      <ListManager
        mapping={PRODUCT_MAPPING}
        createFormRef={createProductForm.ref}
        editFormRef={editProductForm.ref}
      />
      
      {/* Render the form components */}
      <createProductForm.Component />
      <editProductForm.Component />
    </>
  );
}

/**
 * This pattern gives you:
 * 
 * ✅ Self-contained forms - each form manages its own state and logic
 * ✅ Clean API - FormBuilder.create({...}) returns { ref, Component }
 * ✅ Flexible children - use FormText, FormNumber, and ANY React components
 * ✅ Side effects - add custom components, hooks, anything you want
 * ✅ Separation of concerns - ListManager only manages list visibility
 * 
 * The form receives the record when editing via the onSubmit callback:
 *   onSubmit: async (values, record) => {
 *     if (record) {
 *       // Editing mode - record contains the item being edited
 *       await api.patch(`/items/${record.id}`, values);
 *     } else {
 *       // Creating mode
 *       await api.post("/items", values);
 *     }
 *   }
 */

