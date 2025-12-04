import { z } from "zod";
import { uuid } from "../../../../shared/zod-utils";

export { successResponseSchema, errorResponseSchema } from "../../../../shared/response-types";
export type { SuccessResponse, ErrorResponse } from "../../../../shared/response-types";

export const productUnitResponseSchema = z.object({
    id: uuid(),
    name: z.string(),
    symbol: z.string().nullable(),
    businessId: uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ProductUnitResponse = z.infer<typeof productUnitResponseSchema>;
