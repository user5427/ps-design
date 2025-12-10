import { createFileRoute, redirect } from "@tanstack/react-router";
import { FloorPlanDashboard } from "@/components/features/floor-plan/floor-plan-dashboard";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/floor-plan")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: FloorPlanPage,
});

function FloorPlanPage() {
  return <FloorPlanDashboard />;
}
