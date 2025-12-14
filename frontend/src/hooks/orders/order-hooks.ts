import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  getOrder,
  initiateOrderStripePayment,
  payOrderApi,
  cancelOrderApi,
  refundOrderApi,
  sendOrderItems,
  updateOrderItems,
  updateOrderTotals,
} from "@/api/orders";
import type { OrderResponse, UpdateOrderItemsBody } from "@ps-design/schemas/order/order";

export const orderKeys = {
  all: ["orders"] as const,
  order: (orderId: string) => [...orderKeys.all, orderId] as const,
};

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.order(orderId),
    queryFn: () => getOrder(orderId),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
  });
}

export function useUpdateOrderItems(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateOrderItemsBody) => updateOrderItems(orderId, body),
    onSuccess: (order: OrderResponse) => {
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );
    },
  });
}

export function useSendOrderItems(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sendOrderItems(orderId),
    onSuccess: (order: OrderResponse) => {
      // Update cache immediately with the response
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );

      // And refetch from the backend to ensure we have a fully
      // hydrated order (including all relations) so that recently
      // sent items appear on the ticket without a manual refresh.
      queryClient.invalidateQueries({ queryKey: orderKeys.order(orderId) });
    },
  });
}

export function useUpdateOrderTotals(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { tipAmount: number; discountAmount: number }) =>
      updateOrderTotals(orderId, body),
    onSuccess: (order: OrderResponse) => {
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );
    },
  });
}

export function usePayOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { paymentMethod: "CASH" | "CARD" | "GIFT_CARD"; amount: number }) =>
      payOrderApi(orderId, body),
    onSuccess: (order: OrderResponse) => {
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );
    },
  });
}

export function useRefundOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { amount?: number; reason?: string }) =>
      refundOrderApi(orderId, body),
    onSuccess: (order: OrderResponse) => {
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );
    },
  });
}

export function useInitiateOrderStripePayment(orderId: string) {
  return useMutation({
    mutationFn: () => initiateOrderStripePayment(orderId),
  });
}

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrderApi(orderId),
    onSuccess: (order: OrderResponse) => {
      queryClient.setQueryData<OrderResponse | undefined>(
        orderKeys.order(orderId),
        order,
      );
    },
  });
}
