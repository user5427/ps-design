# FormBuilder Refactoring - Architecture Overview

## What Changed

The `FormBuilder` component has been refactored to be **element-based** rather than definition-based. Instead of accepting JSON field definitions, it now takes **actual FormElement components as children**.

## Architecture

### Components

```
FormBuilder (wrapper/container)
├── Manages form state (TanStack Form)
├── Handles submission
├── Integrates MessageManager
└── Takes FormElement components as children

FormElements (components)
├── FormText (text, email, password)
├── FormNumber
├── FormDate
├── FormDateTime
├── FormTextarea
├── FormSelect
├── FormAutocomplete
└── FormCheckbox

Validation (utilities)
├── ValidationRule type
├── minLengthValidator()
├── maxLengthValidator()
├── emailValidator
├── minValueValidator()
├── maxValueValidator()
└── patternValidator()

ListManager (integration layer)
├── Uses FormBuilder with FormElements
├── Generates FormElements from field definitions
├── Manages list pagination with SmartPaginationList
├── Handles CRUD operations
└── Integrates MessageManager
```

## Key Files

- `form-builder.tsx` - Main wrapper component
- `form-elements.tsx` - Individual element components
- `validation.ts` - Validation utilities
- `list-manager.tsx` - Integration component for lists with CRUD

## Usage Patterns

### Pattern 1: Direct FormBuilder Usage (Full Control)

```tsx
<FormBuilder
  open={open}
  onClose={() => setOpen(false)}
  title="Create Product"
  onSubmit={async (values) => {
    await api.post("/products", values);
  }}
>
  {(form) => (
    <>
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => 
            !value ? "Required" : undefined
        }}
      >
        {(field) => (
          <FormText
            fieldName="name"
            label="Name"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={!!field.state.meta.errors.length}
            helperText={field.state.meta.errors[0] || ""}
          />
        )}
      </form.Field>
    </>
  )}
</FormBuilder>
```

### Pattern 2: ListManager with Definitions (Auto-generation)

```tsx
const fields: FormFieldDefinition[] = [
  {
    name: "name",
    label: "Product Name",
    type: "text",
    required: true,
    validation: minLengthValidator(3),
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    validation: minValueValidator(0),
  },
];

<ListManager
  mapping={productMapping}
  createFormFields={fields}
  editFormFields={fields}
  onCreate={async (values) => {...}}
  onEdit={async (id, values) => {...}}
  onDelete={async (ids) => {...}}
/>
```

## Benefits

✅ **Full Control**: With direct FormBuilder usage, you have complete control over form layout and element composition
✅ **Flexible**: Mix and match components, add custom elements, control spacing and styling
✅ **Validation**: Built-in validation support with reusable validators
✅ **Reusable**: FormElements can be used independently anywhere
✅ **Messages**: Integrated MessageManager for notifications
✅ **Convenience**: ListManager provides auto-generation from definitions

## Migration Guide

Old code using field definitions now goes through ListManager or you can build forms directly with FormBuilder + FormElements.
