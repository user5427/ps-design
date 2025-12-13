import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { AuditBusinessLogsListView } from "@/components/features/audit";

export const Route = createFileRoute("/audit/business-logs")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: BusinessLogsPage,
});

function BusinessLogsPage() {
  return <AuditBusinessLogsListView />;
}
