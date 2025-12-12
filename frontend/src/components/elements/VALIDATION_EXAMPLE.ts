/**
 * Example: Using ListManager with Form Validation
 * 
 * This demonstrates how to use the new ListManager component with custom validation
 */

import { ListManager, type FormFieldDefinition, type ValidationRule } from "@/components/elements";

// Custom validation rules
const emailValidator: ValidationRule = (value) => {
  if (!value) return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value)) ? undefined : "Please enter a valid email address";
};

const passwordValidator: ValidationRule = (value) => {
  if (!value) return undefined;
  if (String(value).length < 8) return "Password must be at least 8 characters";
  return undefined;
};

const minLengthValidator = (min: number): ValidationRule => (value) => {
  if (!value) return undefined;
  return String(value).length >= min ? undefined : `Must be at least ${min} characters`;
};

const maxLengthValidator = (max: number): ValidationRule => (value) => {
  if (!value) return undefined;
  return String(value).length <= max ? undefined : `Must be no more than ${max} characters`;
};

// Form field definitions with validation
const productFormFields: FormFieldDefinition[] = [
  {
    name: "name",
    label: "Product Name",
    type: "text",
    required: true,
    placeholder: "Enter product name",
    validation: minLengthValidator(3),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Enter product description",
    rows: 4,
    validation: maxLengthValidator(500),
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    required: true,
    validation: (value) => {
      if (!value) return undefined;
      const num = Number(value);
      return num > 0 ? undefined : "Price must be greater than 0";
    },
  },
  {
    name: "email",
    label: "Contact Email",
    type: "email",
    required: true,
    validation: emailValidator,
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: [
      { value: "electronics", label: "Electronics" },
      { value: "clothing", label: "Clothing" },
      { value: "food", label: "Food" },
    ],
  },
  {
    name: "isActive",
    label: "Active",
    type: "checkbox",
  },
];

// Example component usage
export function ProductManagementPage() {
  const handleCreate = async (values: Record<string, unknown>) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error("Failed to create product");
  };

  const handleEdit = async (id: string, values: Record<string, unknown>) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error("Failed to update product");
  };

  const handleDelete = async (ids: string[]) => {
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Failed to delete product");
  };

  return (
    <ListManager
      mapping={productMapping}
      createFormFields={productFormFields}
      editFormFields={productFormFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      createModalTitle="Create New Product"
      editModalTitle="Edit Product"
    />
  );
}

/**
 * Validation Rule Examples:
 * 
 * 1. Required field with custom validator:
 *    validation: (value) => {
 *      if (!value) return undefined;
 *      return isValid(value) ? undefined : "Error message";
 *    }
 * 
 * 2. Multiple validators:
 *    validation: [minLengthValidator(5), maxLengthValidator(100)]
 * 
 * 3. Conditional validation:
 *    validation: (value) => {
 *      if (someCondition) return "Error 1";
 *      if (anotherCondition) return "Error 2";
 *      return undefined;
 *    }
 */
