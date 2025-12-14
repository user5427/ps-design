import { apiClient } from "@/api/client";
import type {
  TaxResponse,
  CreateTaxBody,
  UpdateTaxBody,
} from "@ps-design/schemas/tax";

export async function getAllTaxes(): Promise<TaxResponse[]> {
  const response = await apiClient.get<TaxResponse[]>("/tax");
  return response.data;
}

export async function getTaxById(taxId: string): Promise<TaxResponse> {
  const response = await apiClient.get<TaxResponse>(`/tax/${taxId}`);
  return response.data;
}

export async function createTax(data: CreateTaxBody): Promise<TaxResponse> {
  const response = await apiClient.post<TaxResponse>("/tax", data);
  return response.data;
}

export async function updateTax(taxId: string, data: UpdateTaxBody): Promise<TaxResponse> {
  const response = await apiClient.put<TaxResponse>(`/tax/${taxId}`, data);
  return response.data;
}

export async function deleteTax(taxId: string): Promise<void> {
  await apiClient.delete(`/tax/${taxId}`);
}