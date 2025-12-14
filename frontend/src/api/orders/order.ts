import { apiClient } from "@/api/client";
import type {
  CreateOrderBody,
  OrderIdParams,
  OrderResponse,
  PayOrderBody,
  RefundOrderBody,
  UpdateOrderItemsBody,
  UpdateOrderTotalsBody,
} from "@ps-design/schemas/order/order";

export async function createOrder(body: CreateOrderBody): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>("/orders", body);
  return response.data;
}

export async function getOrder(orderId: string): Promise<OrderResponse> {
  const params: OrderIdParams = { orderId };
  const response = await apiClient.get<OrderResponse>(`/orders/${params.orderId}`);
  return response.data;
}

export async function updateOrderItems(
  orderId: string,
  body: UpdateOrderItemsBody,
): Promise<OrderResponse> {
  const response = await apiClient.put<OrderResponse>(
    `/orders/${orderId}/items`,
    body,
  );
  return response.data;
}

export async function sendOrderItems(orderId: string): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    `/orders/${orderId}/send`,
  );
  return response.data;
}

export async function updateOrderTotals(
  orderId: string,
  body: UpdateOrderTotalsBody,
): Promise<OrderResponse> {
  const response = await apiClient.patch<OrderResponse>(
    `/orders/${orderId}/totals`,
    body,
  );
  return response.data;
}

export async function payOrderApi(
  orderId: string,
  body: PayOrderBody,
): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    `/orders/${orderId}/pay`,
    body,
  );
  return response.data;
}

export async function refundOrderApi(
  orderId: string,
  body: RefundOrderBody,
): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    `/orders/${orderId}/refund`,
    body,
  );
  return response.data;
}

export async function initiateOrderStripePayment(
  orderId: string,
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  finalAmount: number;
}> {
  const response = await apiClient.post<{
    clientSecret: string;
    paymentIntentId: string;
    finalAmount: number;
  }>(`/orders/${orderId}/pay/initiate`);
  return response.data;
}

export async function cancelOrderApi(orderId: string): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(
    `/orders/${orderId}/cancel`,
  );
  return response.data;
}
