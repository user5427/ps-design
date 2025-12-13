import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { AuditSecurityLogsListView } from "@/components/features/audit/audit-security-logs-list-view";

export const Route = createFileRoute("/audit/security-logs")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: SecurityLogsPage,
});

function SecurityLogsPage() {
  return <AuditSecurityLogsListView />;
}
