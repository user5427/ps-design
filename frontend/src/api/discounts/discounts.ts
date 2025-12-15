import { apiClient } from "@/api/client";
import type {
  CreateDiscountBody,
  UpdateDiscountBody,
  DiscountResponse,
  ApplicableDiscountResponse,
} from "@ps-design/schemas/discount";

export async function getDiscounts(): Promise<DiscountResponse[]> {
  const response = await apiClient.get<DiscountResponse[]>("/discounts/");
  return response.data;
}

export async function getDiscountById(id: string): Promise<DiscountResponse> {
  const response = await apiClient.get<DiscountResponse>(`/discounts/${id}`);
  return response.data;
}

export async function createDiscount(
  data: CreateDiscountBody,
): Promise<DiscountResponse> {
  const response = await apiClient.post<DiscountResponse>("/discounts/", data);
  return response.data;
}

export async function updateDiscount(
  id: string,
  data: UpdateDiscountBody,
): Promise<DiscountResponse> {
  const response = await apiClient.put<DiscountResponse>(
    `/discounts/${id}`,
    data,
  );
  return response.data;
}

export async function deleteDiscount(id: string): Promise<void> {
  await apiClient.delete(`/discounts/${id}`);
}

export async function getApplicableOrderDiscount(
  menuItemIds: string[],
  orderTotal: number,
): Promise<ApplicableDiscountResponse | null> {
  const response = await apiClient.get<ApplicableDiscountResponse | null>(
    "/discounts/applicable/order",
    {
      params: { menuItemIds, orderTotal },
    },
  );
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
