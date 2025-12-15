import type { MRT_ColumnDef } from "material-react-table";
import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import {
  RecordListView,
  type ViewFieldDefinition,
} from "@/components/elements/record-list-view";
import { useBusinessesPaginated } from "@/queries/business";
import type { BusinessResponse } from "@ps-design/schemas/business";
import { RoleManager } from "./role-manager";

export function ManageRoles() {
  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessResponse | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  // Fetch all businesses for the picker
  const {
    data: businessData,
    isLoading: businessesLoading,
    error: businessError,
    refetch: refetchBusinesses,
  } = useBusinessesPaginated(1, 100, undefined);
  const businesses = businessData?.items || [];

  const businessColumns = useMemo<MRT_ColumnDef<BusinessResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "id",
        header: "ID",
        size: 200,
      },
    ],
    [],
  );

  const businessViewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleSelectBusiness = (business: BusinessResponse) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const handleCloseBusiness = () => {
    setShowBusinessModal(false);
    setSelectedBusiness(null);
  };

  return (
    <>
      <RecordListView<BusinessResponse>
        title="Manage Business Roles"
        columns={businessColumns}
        data={businesses}
        isLoading={businessesLoading}
        error={businessError}
        viewFields={businessViewFields}
        onSuccess={refetchBusinesses}
        viewModalTitle="View Business"
        renderRowActions={({ row }) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleSelectBusiness(row as BusinessResponse)}
          >
            Manage Roles
          </Button>
        )}
      />

      {selectedBusiness && (
        <RoleManager
          businessId={selectedBusiness.id}
          open={showBusinessModal}
          onClose={handleCloseBusiness}
        />
      )}
    </>
  );
}
