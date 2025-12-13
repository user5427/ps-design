import { GiftCardsListView } from "@/components/features/gift-cards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gift-cards")({
  component: RouteComponent,
});

function RouteComponent() {
  return <GiftCardsListView />;
}
