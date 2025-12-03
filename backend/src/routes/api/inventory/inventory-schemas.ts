import { z } from "zod";

export const stockChangeTypeEnum = z.enum(["SUPPLY", "USAGE", "ADJUSTMENT", "WASTE"]);
