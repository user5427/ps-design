import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFloorPlan, updateFloorTable } from "@/api/orders";
import type { FloorPlanResponse } from "@ps-design/schemas/order/floor";

export const floorKeys = {
  all: ["floor"] as const,
  floorPlan: () => [...floorKeys.all, "plan"] as const,
};

export function useFloorPlan() {
  return useQuery({
    queryKey: floorKeys.floorPlan(),
    queryFn: getFloorPlan,
  });
}

interface UpdateFloorTableArgs {
  tableId: string;
  reserved?: boolean;
}

export function useUpdateFloorTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, reserved }: UpdateFloorTableArgs) =>
      updateFloorTable(tableId, { reserved }),
    onSuccess: (updatedTable) => {
      queryClient.setQueryData<FloorPlanResponse | undefined>(
        floorKeys.floorPlan(),
        (old) => {
          if (!old) return old;
          return {
            tables: old.tables.map((t) =>
              t.id === updatedTable.id ? updatedTable : t,
            ),
          };
        },
      );
    },
  });
}
