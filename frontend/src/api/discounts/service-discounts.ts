import { apiClient } from "@/api/client";
import type {
  CreateServiceDiscountBody,
  DiscountResponse,
  UpdateServiceDiscountBody,
} from "@ps-design/schemas/discount";

export async function getServiceDiscounts(): Promise<DiscountResponse[]> {
  const response = await apiClient.get<DiscountResponse[]>(
    "/discounts/services",
  );
  return response.data;
}

export async function createServiceDiscount(
  data: CreateServiceDiscountBody,
): Promise<DiscountResponse> {
  const response = await apiClient.post<DiscountResponse>(
    "/discounts/services",
    data,
  );
  return response.data;
}

export async function updateServiceDiscount(
  id: string,
  data: UpdateServiceDiscountBody,
): Promise<DiscountResponse> {
  const response = await apiClient.put<DiscountResponse>(
    `/discounts/services/${id}`,
    data,
  );
  return response.data;
}

export async function deleteServiceDiscount(id: string): Promise<void> {
  await apiClient.delete(`/discounts/services/${id}`);
}
