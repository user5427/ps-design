import { z } from "zod";
import { StockChangeType } from "../../../modules/inventory/stock-change";

export const stockChangeTypeEnum = z.enum(StockChangeType);
