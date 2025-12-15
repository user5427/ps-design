import { apiClient } from "@/api/client";
import type {
    CreateMenuDiscountBody,
    DiscountResponse,
    UpdateMenuDiscountBody,
} from "@ps-design/schemas/discount";

export async function getMenuDiscounts(): Promise<DiscountResponse[]> {
    const response = await apiClient.get<DiscountResponse[]>("/discounts/menu");
    return response.data;
}

export async function createMenuDiscount(
    data: CreateMenuDiscountBody,
): Promise<DiscountResponse> {
    const response = await apiClient.post<DiscountResponse>(
        "/discounts/menu",
        data,
    );
    return response.data;
}

export async function updateMenuDiscount(
    id: string,
    data: UpdateMenuDiscountBody,
): Promise<DiscountResponse> {
    const response = await apiClient.put<DiscountResponse>(
        `/discounts/${id}`,
        data,
    );
    return response.data;
}
