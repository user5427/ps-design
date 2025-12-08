import { z } from "zod";
import { uuid } from "@/schemas/shared/zod-utils";

const MIN_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_SYMBOL_LENGTH = 10;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;
const MIN_SYMBOL_MESSAGE = `Symbol must be at least ${MIN_LENGTH} characters`;
const MAX_SYMBOL_MESSAGE = `Symbol must be at most ${MAX_SYMBOL_LENGTH} characters`;

export const UnitIdParam = z.object({ unitId: uuid() });

export const CreateProductUnitSchema = z.object({
  name: z
    .string()
    .min(MIN_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
  symbol: z
    .string()
    .min(MIN_LENGTH, MIN_SYMBOL_MESSAGE)
    .max(MAX_SYMBOL_LENGTH, MAX_SYMBOL_MESSAGE)
    .optional(),
});

export const UpdateProductUnitSchema = z.object({
  name: z
    .string()
    .min(MIN_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
  symbol: z
    .string()
    .min(MIN_LENGTH, MIN_SYMBOL_MESSAGE)
    .max(MAX_SYMBOL_LENGTH, MAX_SYMBOL_MESSAGE)
    .optional(),
});

export type CreateProductUnitBody = z.infer<typeof CreateProductUnitSchema>;
export type UpdateProductUnitBody = z.infer<typeof UpdateProductUnitSchema>;
export type UnitIdParams = z.infer<typeof UnitIdParam>;
