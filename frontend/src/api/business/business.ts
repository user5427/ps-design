import { apiClient } from "@/api/client";
import type { BusinessUserResponse } from "@ps-design/schemas/business";

export async function getBusinessUsers(
  businessId: string,
): Promise<BusinessUserResponse[]> {
  const response = await apiClient.get<BusinessUserResponse[]>(
    `/business/${businessId}/users`,
  );
  return response.data;
}
