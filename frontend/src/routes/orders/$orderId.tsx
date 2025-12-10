import { createFileRoute, redirect } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { OrderView } from "@/components/features/orders/order-view";

export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: OrderViewPage,
});

function OrderViewPage() {
  const { orderId } = Route.useParams();

  return <OrderView orderId={orderId} />;
}
