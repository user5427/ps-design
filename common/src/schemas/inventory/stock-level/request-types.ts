import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

export const StockLevelProductIdParam = z.object({ productId: uuid() });
export type StockLevelProductIdParams = z.infer<typeof StockLevelProductIdParam>;
