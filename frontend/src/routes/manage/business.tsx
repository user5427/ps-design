import { createFileRoute } from "@tanstack/react-router";
import { BusinessList } from "@/components/features/business/business-list";

export const Route = createFileRoute("/manage/business")({
  component: BusinessListPage,
});

function BusinessListPage() {
  return <BusinessList />;
}
