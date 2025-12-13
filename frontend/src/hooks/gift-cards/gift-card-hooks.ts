import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createGiftCard,
    deleteGiftCard,
    getGiftCards,
    updateGiftCard,
    validateGiftCard,
} from "@/api/gift-cards";
import type {
    CreateGiftCardBody,
    UpdateGiftCardBody,
} from "@ps-design/schemas/gift-card";

export const giftCardKeys = {
    all: ["gift-cards"] as const,
    list: () => [...giftCardKeys.all] as const,
};

export function useGiftCards() {
    return useQuery({
        queryKey: giftCardKeys.list(),
        queryFn: () => getGiftCards(),
    });
}

export function useCreateGiftCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateGiftCardBody) => createGiftCard(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: giftCardKeys.all });
        },
    });
}

export function useUpdateGiftCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateGiftCardBody }) =>
            updateGiftCard(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: giftCardKeys.all });
        },
    });
}

export function useDeleteGiftCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteGiftCard(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: giftCardKeys.all });
        },
    });
}

export function useValidateGiftCard() {
    return useMutation({
        mutationFn: (code: string) => validateGiftCard(code),
    });
}
