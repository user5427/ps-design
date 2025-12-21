import { apiClient } from "@/api/client";
import type {
  DiscountResponse,
  ApplicableDiscountResponse,
} from "@ps-design/schemas/discount";

export async function getDiscountById(id: string): Promise<DiscountResponse> {
  const response = await apiClient.get<DiscountResponse>(`/discounts/${id}`);
  return response.data;
}

export async function getApplicableServiceDiscount(
  serviceDefinitionId: string,
  servicePrice: number,
): Promise<ApplicableDiscountResponse | null> {
  const response = await apiClient.get<ApplicableDiscountResponse | null>(
    "/discounts/applicable/service",
    {
      params: { serviceDefinitionId, servicePrice },
    },
  );
  return response.data;
}
