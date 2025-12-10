import type { z } from "zod";

/**
 * Represents a field mapping for pagination/querying
 */
export interface FieldMapping {
  [fieldName: string]: {
    column: string;
    type: "string" | "number" | "boolean" | "date";
  };
}

/**
 * Creates field mappings from a Zod schema with TypeScript validation
 * Ensures all fields are either mapped or explicitly excluded
 */
export function createFieldMapping<T extends z.ZodObject<any>>(
  schema: T,
  mappings: FieldMapping,
  excludedFields?: (keyof z.infer<T>)[]
): FieldMapping {
  const schemaKeys = Object.keys((schema as any).shape) as (keyof z.infer<T>)[];
  const mappedKeys = Object.keys(mappings) as (keyof z.infer<T>)[];
  const excluded = excludedFields || [];

  // Check for unmapped fields
  const unmapped = schemaKeys.filter(
    (key) => !mappedKeys.includes(key) && !excluded.includes(key)
  );

  if (unmapped.length > 0) {
    console.warn(
      `Fields not mapped or excluded: ${String(unmapped.join(", "))}. ` +
        `Please add them to mappings or add to excludedFields parameter.`
    );
  }

  return mappings;
}
