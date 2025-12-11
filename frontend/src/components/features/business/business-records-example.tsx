/**
 * Example of AutoRecordListView usage with BUSINESS_MAPPING constant
 * 
 * This demonstrates the refactored approach where:
 * 1. Only the mapping constant and callbacks are needed
 * 2. All columns are auto-generated from mapping.fields
 * 3. All data validation happens automatically
 * 4. Pagination, filtering, sorting are handled internally
 */

import { useState } from "react";
import { AutoRecordListView } from "@/components/elements/record-list-view/auto-record-list-view";
import { BUSINESS_MAPPING } from "@ps-design/constants/business";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import type { BusinessResponse } from "@ps-design/schemas/business";
import { useCreateBusiness, useUpdateBusiness, useDeleteBusiness } from "@/queries/business/business";

/**
 * Simplified Business Records View
 * 
 * The new AutoRecordListView accepts:
 * - mapping: The entity mapping constant that defines fields, endpoint, display name, and schema
 * - onCreate, onEdit, onDelete: Callbacks for CRUD operations that receive fully typed data
 * - query/onQueryChange: Optional external query state management (for advanced filtering/sorting UI)
 * 
 * The component handles:
 * - Auto-generating table columns from mapping.fields
 * - Fetching paginated data with automatic validation
 * - Pagination state management
 * - Row selection for bulk delete
 * - Error handling and display
 * - Success/error notifications
 */
export const BusinessRecordsExample: React.FC = () => {
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();
  
  // Optional: External query state management for advanced filtering/sorting UI
  const [query, setQuery] = useState<UniversalPaginationQuery>({
    page: 1,
    limit: 20,
  });

  const handleCreate = async (data: Partial<BusinessResponse>) => {
    await createMutation.mutateAsync({
      name: String(data.name),
    });
  };

  const handleEdit = async (id: string, data: Partial<BusinessResponse>) => {
    // Note: The actual updateBusiness mutation may have different signature
    // This shows how callbacks receive fully typed data
    await updateMutation.mutateAsync({
      id,
      name: String(data.name),
    });
  };

  const handleDelete = async (ids: string[]) => {
    // Delete each ID (or bulk delete if backend supports)
    await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
  };

  return (
    <AutoRecordListView
      mapping={BUSINESS_MAPPING}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => {
        // Optionally reset query or refresh UI
        setQuery({ page: 1, limit: 20 });
      }}
      hasViewAction={true}
      // Optional: Control query from parent for advanced filtering UI
      query={query}
      onQueryChange={setQuery}
    />
  );
};
