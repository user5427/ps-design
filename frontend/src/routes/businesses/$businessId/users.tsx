import { createFileRoute } from "@tanstack/react-router";
import { BusinessUsersManagement } from "@/components/features/business/users";

export const Route = createFileRoute("/businesses/$businessId/users")({
  component: BusinessUsersPage,
});

function BusinessUsersPage() {
  const { businessId } = Route.useParams();
  return <BusinessUsersManagement businessId={businessId} />;
}
