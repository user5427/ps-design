import z from "zod";
export const StockChangeTypeEnum = z.enum([
  "SUPPLY",
  "USAGE",
  "ADJUSTMENT",
  "WASTE",
]);
export type StockChangeType = z.infer<typeof StockChangeTypeEnum>;
