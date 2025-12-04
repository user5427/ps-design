import { z } from "zod";
import { StockChangeType } from "../../../modules/stock-change";

export const stockChangeTypeEnum = z.enum(StockChangeType);
