import { createFileRoute } from "@tanstack/react-router";
import { BusinessRolesManagement } from "@/components/features/business/roles";

export const Route = createFileRoute("/businesses/$businessId/roles")({
  component: BusinessRolesPage,
});

function BusinessRolesPage() {
  const { businessId } = Route.useParams();
  return <BusinessRolesManagement businessId={businessId} />;
}
