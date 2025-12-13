import { apiClient } from "@/api/client";
import type {
  CreateGiftCardBody,
  UpdateGiftCardBody,
  GiftCardResponse,
} from "@ps-design/schemas/gift-card";

export async function getGiftCards(): Promise<GiftCardResponse[]> {
  const response = await apiClient.get<GiftCardResponse[]>("/gift-cards/");
  return response.data;
}

export async function getGiftCardById(id: string): Promise<GiftCardResponse> {
  const response = await apiClient.get<GiftCardResponse>(`/gift-cards/${id}`);
  return response.data;
}

export async function createGiftCard(
  data: CreateGiftCardBody,
): Promise<GiftCardResponse> {
  const response = await apiClient.post<GiftCardResponse>("/gift-cards/", data);
  return response.data;
}

export async function updateGiftCard(
  id: string,
  data: UpdateGiftCardBody,
): Promise<GiftCardResponse> {
  const response = await apiClient.put<GiftCardResponse>(
    `/gift-cards/${id}`,
    data,
  );
  return response.data;
}

export async function deleteGiftCard(id: string): Promise<void> {
  await apiClient.delete(`/gift-cards/${id}`);
}

export async function validateGiftCard(
  code: string,
): Promise<GiftCardResponse> {
  const response = await apiClient.post<GiftCardResponse>(
    "/gift-cards/validate",
    { code },
  );
  return response.data;
}
