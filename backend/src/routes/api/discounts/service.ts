import type { FastifyInstance } from "fastify";
import type {
    CreateDiscountBody,
    UpdateDiscountBody,
    DiscountResponse,
} from "@ps-design/schemas/discount";
import type { Discount } from "@/modules/discount/discount.entity";

function toDiscountResponse(discount: Discount): DiscountResponse {
    return {
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        targetType: discount.targetType,
        menuItemId: discount.menuItemId,
        menuItemName: discount.menuItem?.baseName ?? null,
        serviceDefinitionId: discount.serviceDefinitionId,
        serviceDefinitionName: discount.serviceDefinition?.name ?? null,
        startsAt: discount.startsAt?.toISOString() ?? null,
        expiresAt: discount.expiresAt?.toISOString() ?? null,
        isDisabled: discount.isDisabled,
        createdAt: discount.createdAt.toISOString(),
        updatedAt: discount.updatedAt.toISOString(),
    };
}

export async function getAllDiscounts(
    fastify: FastifyInstance,
    businessId: string,
): Promise<DiscountResponse[]> {
    const discounts = await fastify.db.discount.findAllByBusinessId(businessId);
    return discounts.map(toDiscountResponse);
}

export async function getDiscountById(
    fastify: FastifyInstance,
    businessId: string,
    id: string,
): Promise<DiscountResponse> {
    const discount = await fastify.db.discount.getById(id, businessId);
    return toDiscountResponse(discount);
}

export async function createDiscount(
    fastify: FastifyInstance,
    businessId: string,
    data: CreateDiscountBody,
): Promise<DiscountResponse> {
    const discount = await fastify.db.discount.create({
        name: data.name,
        type: data.type,
        value: data.value,
        targetType: data.targetType,
        menuItemId: data.menuItemId ?? null,
        serviceDefinitionId: data.serviceDefinitionId ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isDisabled: data.isDisabled ?? false,
        businessId,
    });
    return toDiscountResponse(discount);
}

export async function updateDiscount(
    fastify: FastifyInstance,
    businessId: string,
    id: string,
    data: UpdateDiscountBody,
): Promise<DiscountResponse> {
    const updateData: Parameters<typeof fastify.db.discount.update>[2] = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.targetType !== undefined) updateData.targetType = data.targetType;
    if (data.menuItemId !== undefined) updateData.menuItemId = data.menuItemId;
    if (data.serviceDefinitionId !== undefined)
        updateData.serviceDefinitionId = data.serviceDefinitionId;
    if (data.startsAt !== undefined)
        updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.expiresAt !== undefined)
        updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.isDisabled !== undefined) updateData.isDisabled = data.isDisabled;

    const discount = await fastify.db.discount.update(id, businessId, updateData);
    return toDiscountResponse(discount);
}

export async function deleteDiscount(
    fastify: FastifyInstance,
    businessId: string,
    id: string,
): Promise<void> {
    await fastify.db.discount.delete(id, businessId);
}

export interface ApplicableDiscountResponse {
    id: string;
    name: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    calculatedAmount: number;
}

export async function getApplicableDiscountForOrder(
    fastify: FastifyInstance,
    businessId: string,
    menuItemIds: string[],
    orderTotal: number,
): Promise<ApplicableDiscountResponse | null> {
    const result = await fastify.db.discount.findApplicableForOrder(
        businessId,
        menuItemIds,
        orderTotal,
    );

    if (!result) return null;

    return {
        id: result.discount.id,
        name: result.discount.name,
        type: result.discount.type,
        value: result.discount.value,
        calculatedAmount: result.calculatedAmount,
    };
}

export async function getApplicableDiscountForService(
    fastify: FastifyInstance,
    businessId: string,
    serviceDefinitionId: string,
    servicePrice: number,
): Promise<ApplicableDiscountResponse | null> {
    const result = await fastify.db.discount.findApplicableForService(
        businessId,
        serviceDefinitionId,
        servicePrice,
    );

    if (!result) return null;

    return {
        id: result.discount.id,
        name: result.discount.name,
        type: result.discount.type,
        value: result.discount.value,
        calculatedAmount: result.calculatedAmount,
    };
}
