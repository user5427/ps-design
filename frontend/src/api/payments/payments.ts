import { apiClient } from "@/api/client";
import type {
  InitiatePaymentBody,
  InitiatePaymentResponse,
} from "@ps-design/schemas/payments";

export async function initiatePayment(
  appointmentId: string,
  data: Omit<InitiatePaymentBody, "appointmentId">,
): Promise<InitiatePaymentResponse> {
  const response = await apiClient.post<InitiatePaymentResponse>(
    `/appointments/${appointmentId}/pay/initiate`,
    data,
  );
  return response.data;
}
