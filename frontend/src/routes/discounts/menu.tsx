import { DiscountsListView } from "@/components/features/discounts";
import {
  useCreateMenuDiscount,
  useDeleteDiscount,
  useMenuDiscounts,
  useUpdateMenuDiscount,
} from "@/hooks/discounts/discount-hooks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/discounts/menu")({
  component: MenuDiscountsRoute,
});

function MenuDiscountsRoute() {
  return (
    <DiscountsListView
      title="Discounts"
      useDiscounts={useMenuDiscounts}
      useCreateDiscount={useCreateMenuDiscount}
      useUpdateDiscount={useUpdateMenuDiscount}
      useDeleteDiscount={useDeleteDiscount}
      allowedTargetTypes={["MENU_ITEM", "ORDER"]}
    />
  );
}
