import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";
import { StaffServicesListView } from "@/components/features/appointments";

export const Route = createFileRoute("/appointments/staff-services")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: StaffServicesPage,
});

function StaffServicesPage() {
  return <StaffServicesListView />;
}
