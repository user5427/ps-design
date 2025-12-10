import { apiClient } from "@/api/client";
import type {
  BusinessResponse,
  CreateBusinessBody,
  PaginatedBusinessResponse,
  UpdateBusinessBody,
} from "@ps-design/schemas/business";
import type { SuccessResponse } from "@ps-design/schemas/shared";

export async function getBusinessesPaginated(
  page: number,
  limit: number,
  search?: string,
): Promise<PaginatedBusinessResponse> {
  const response = await apiClient.get<PaginatedBusinessResponse>(
    "/business",
    {
      params: { page, limit, search },
    },
  );
  return response.data;
}

export async function getBusinessById(
  businessId: string,
): Promise<BusinessResponse> {
  const response = await apiClient.get<BusinessResponse>(
    `/business/${businessId}`,
  );
  return response.data;
}

export async function createBusiness(
  data: CreateBusinessBody,
): Promise<BusinessResponse> {
  const response = await apiClient.post<BusinessResponse>("/business", data);
  return response.data;
}

export async function updateBusiness(
  businessId: string,
  data: UpdateBusinessBody,
): Promise<BusinessResponse> {
  const response = await apiClient.put<BusinessResponse>(
    `/business/${businessId}`,
    data,
  );
  return response.data;
}

export async function deleteBusiness(
  businessId: string,
): Promise<SuccessResponse> {
  const response = await apiClient.delete<SuccessResponse>(
    `/business/${businessId}`,
  );
  return response.data;
}
