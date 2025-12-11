import { apiClient } from "@/api/client";
import type {
  FloorPlanResponse,
  FloorTable,
  UpdateFloorTableBody,
} from "@ps-design/schemas/order/floor";

export async function getFloorPlan(): Promise<FloorPlanResponse> {
  const response = await apiClient.get<FloorPlanResponse>("/orders/floor");
  return response.data;
}

export async function updateFloorTable(
  tableId: string,
  data: UpdateFloorTableBody,
): Promise<FloorTable> {
  const response = await apiClient.patch<FloorTable>(
    `/orders/floor/${tableId}`,
    data,
  );
  return response.data;
}
