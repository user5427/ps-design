import { DiscountsListView } from "@/components/features/discounts";
import {
  useCreateServiceDiscount,
  useDeleteDiscount, // Delete is generic
  useServiceDiscounts,
  useUpdateServiceDiscount,
} from "@/hooks/discounts/discount-hooks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/discounts/services")({
  component: ServiceDiscountsRoute,
});

function ServiceDiscountsRoute() {
  return (
    <DiscountsListView
      title="Discounts"
      useDiscounts={useServiceDiscounts}
      useCreateDiscount={useCreateServiceDiscount}
      useUpdateDiscount={useUpdateServiceDiscount}
      useDeleteDiscount={useDeleteDiscount}
      allowedTargetTypes={["SERVICE", "ORDER"]}
    />
  );
}
