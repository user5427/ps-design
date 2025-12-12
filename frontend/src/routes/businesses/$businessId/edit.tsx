import { createFileRoute } from "@tanstack/react-router";
import { BusinessEdit } from "@/components/features/business";

export const Route = createFileRoute("/businesses/$businessId/edit")({
  component: BusinessEditPage,
});

function BusinessEditPage() {
  return <BusinessEdit />;
}
