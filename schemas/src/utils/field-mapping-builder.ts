import type { z } from "zod";

/**
 * Complete field mapping with display name and query metadata
 */
export interface FieldConfig {
  column: string; // Database column name for backend queries
  type: "string" | "number" | "boolean" | "date";
  displayName: string; // Display label for UI (e.g., "Business Name", "Created Date")
}

/**
 * Represents a complete field mapping including UI and API metadata
 */
export interface FieldMapping {
  [fieldName: string]: FieldConfig;
}

/**
 * Complete entity mapping with field definitions and metadata
 */
export interface EntityMapping<T extends z.ZodObject<any>> {
  fields: FieldMapping;
  endpoint: string; // API endpoint URL for this entity (e.g., "/api/business")
  displayName: string; // Display name for the entity (e.g., "Business")
  schema: T; // Zod schema for validation
}

/**
 * Converts camelCase field names to Title Case for display
 * @example "businessName" -> "Business Name"
 */
function camelCaseToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1") // Add space before uppercase letters
    .replace(/^./, (c) => c.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Creates entity mappings from a Zod schema with TypeScript validation
 * Ensures all fields are either mapped or explicitly excluded
 * 
 * @example
 * ```ts
 * const mapping = createEntityMapping(
 *   BusinessResponseSchema,
 *   {
 *     name: { column: "business.name", type: "string", displayName: "Name" },
 *   },
 *   ["id"], // Excluded fields
 *   "/api/business", // Endpoint
 *   "Business" // Display name
 * );
 * ```
 */
export function createEntityMapping<T extends z.ZodObject<any>>(
  schema: T,
  mappings: Partial<Record<keyof z.infer<T>, Omit<FieldConfig, "displayName">>> & {
    [K in keyof Record<keyof z.infer<T>, never>]?: FieldConfig;
  },
  excludedFields: (keyof z.infer<T>)[] = [],
  endpoint: string,
  displayName: string
): EntityMapping<T> {
  const schemaKeys = Object.keys((schema as any).shape) as (keyof z.infer<T>)[];
  const mappedKeys = Object.keys(mappings) as (keyof z.infer<T>)[];

  // Check for unmapped fields
  const unmapped = schemaKeys.filter(
    (key) => !mappedKeys.includes(key) && !excludedFields.includes(key)
  );

  if (unmapped.length > 0) {
    console.warn(
      `Fields not mapped or excluded: ${String(unmapped.join(", "))}. ` +
        `Please add them to mappings or add to excludedFields parameter.`
    );
  }

  // Build final field mappings with auto-generated display names if not provided
  const finalFields: FieldMapping = {};
  for (const [fieldName, config] of Object.entries(mappings)) {
    const typedName = fieldName as keyof z.infer<T>;
    finalFields[fieldName as string] = {
      ...(config as FieldConfig),
      displayName:
        (config as any).displayName || camelCaseToTitleCase(fieldName as string),
    };
  }

  return {
    fields: finalFields,
    endpoint,
    displayName,
    schema,
  };
}

/**
 * Utility to extract just the field mappings from an entity mapping
 * Useful for backward compatibility with code expecting plain field mappings
 */
export function getFieldMappings(entityMapping: EntityMapping<any>): FieldMapping {
  return entityMapping.fields;
}
