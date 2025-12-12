# Form & List Management Architecture

## Overview

This refactored system provides **clean separation of concerns** with three independent layers:

### 1. **FormBuilder** - Dumb Modal Wrapper
A simple component that:
- Wraps form content in a modal dialog
- Handles form submission
- Displays validation errors
- Nothing more

```tsx
<FormBuilder
  open={isOpen}
  onClose={() => setOpen(false)}
  title="Create Product"
  onSubmit={async (values) => { /* API call */ }}
>
  {(form) => /* Your form fields here */}
</FormBuilder>
```

### 2. **ListManager** - Pure State Manager
Manages state for list + CRUD operations:
- Modal visibility (create, edit)
- Which record is being edited
- Pagination refetch after operations
- Notifications via MessageManager

Importantly, **it does NOT dictate form structure** - forms are passed in as props.

```tsx
<ListManager
  mapping={productMapping}
  createForm={myFormSchema}
  editForm={myFormSchema}
  onCreate={handleCreate}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 3. **Form Content** - Built Independently
Forms are **constants** (not components) that you define:
- Reusable across multiple screens
- Can be imported from anywhere
- Full control over structure
- Easy to test

```tsx
export const productForm = (form) => (
  <>
    <form.Field name="name" defaultValue="">
      {(field) => <FormText ... />}
    </form.Field>
    {/* More fields... */}
  </>
);
```

## Why This Architecture?

### Maximum Flexibility
- **You control form structure** - not dictated by ListManager
- **Reuse forms everywhere** - define once, use in multiple places
- **Easy to test** - forms are just functions
- **Easy to compose** - combine forms for different use cases

### Clean Separation
- **FormBuilder** doesn't know about data - just handles modal UI
- **ListManager** doesn't know about form structure - just manages state
- **Forms** don't know about ListManager - can exist independently
- **Each component has one responsibility**

### Example: One Form, Multiple Uses

```tsx
// Define once
const userForm = (form) => (
  <>
    <form.Field name="email">...</form.Field>
    <form.Field name="name">...</form.Field>
  </>
);

// Use in ListManager
<ListManager createForm={userForm} editForm={userForm} />

// Use in standalone FormBuilder
<FormBuilder open={true}>{userForm}</FormBuilder>

// Use in custom page
<YourCustomForm>{userForm}</YourCustomForm>
```

## Validation

Validation happens inside forms at the field level using TanStack Form validators:

```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) => {
      if (!value) return "Email is required";
      if (!isValidEmail(value)) return "Invalid email";
      return undefined;
    },
  }}
>
  {(field) => <FormText error={field.state.meta.errors.length > 0} />}
</form.Field>
```

## Using Pre-built Validators

```tsx
import { 
  emailValidator, 
  minLengthValidator,
  minValueValidator,
  maxLengthValidator 
} from "@ps-design/elements";

// Combine validators
const validate = (value) => {
  return emailValidator(value) || minLengthValidator(5)(value);
};
```

## Message Management

All CRUD operations automatically show success/error messages:

```tsx
<ListManager
  onCreate={handleCreate}
  // ✅ Automatically shows "Record created successfully"
  // ✅ Automatically shows error message on failure
/>
```

## State Management

If you need access to ListManager's internal state:

```tsx
const [managerState, setManagerState] = useState(null);

<ListManager
  onStateChange={(state) => {
    // state.createModalOpen - is create modal open?
    // state.editModalOpen - is edit modal open?
    // state.editingRecord - which record is being edited?
    // state.openCreateModal() - function to open create modal
    // state.openEditModal(record) - function to open edit modal with record
    // state.messageManager - access to message manager
    setManagerState(state);
  }}
/>
```

## Form Fields Available

- `FormText` - Text, email, password
- `FormNumber` - Numbers with validation
- `FormDate` - Date picker
- `FormDateTime` - Date + time
- `FormTextarea` - Multi-line text
- `FormSelect` - Dropdown with options
- `FormAutocomplete` - Search-able dropdown
- `FormCheckbox` - Boolean field

See `form-elements.tsx` for all available fields.

## Complete Example

See [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx) for a complete, working example showing:
1. How to define forms
2. How to use ListManager
3. How to use FormBuilder directly
