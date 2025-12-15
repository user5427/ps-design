import { DiscountsListView } from "@/components/features/discounts";
import {
  useCreateServiceDiscount,
  useDeleteServiceDiscount,
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
      useDeleteDiscount={useDeleteServiceDiscount}
      allowedTargetTypes={["SERVICE", "ORDER"]}
    />
  );
}
