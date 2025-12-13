import { apiClient } from "@/api/client";
import type {
  CreatePaymentIntentBody,
  CreatePaymentIntentResponse,
} from "@ps-design/schemas/payments";

export async function createPaymentIntent(
  data: CreatePaymentIntentBody,
): Promise<CreatePaymentIntentResponse> {
  const response = await apiClient.post<CreatePaymentIntentResponse>(
    "/payments/create-intent",
    data,
  );
  return response.data;
}

export async function getStripeConfig(): Promise<{ stripeEnabled: boolean }> {
  const response = await apiClient.get<{ stripeEnabled: boolean }>(
    "/payments/config",
  );
  return response.data;
}
