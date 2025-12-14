import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { TaxesListView } from "@/components/features/tax";

export const Route = createFileRoute("/tax")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: TaxPage,
});

function TaxPage() {
  return <TaxesListView />;
}
