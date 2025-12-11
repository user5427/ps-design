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
export interface EntityMapping {
  fields: FieldMapping;
  endpoint: string; // API endpoint URL for this entity (e.g., "/api/business")
  displayName: string; // Display name for the entity (e.g., "Business")
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
 * Creates entity mappings from field definitions
 * 
 * @example
 * ```ts
 * const mapping = createEntityMapping(
 *   {
 *     name: { column: "business.name", type: "string", displayName: "Name" },
 *   },
 *   "/api/business", // Endpoint
 *   "Business" // Display name
 * );
 * ```
 */
export function createEntityMapping(
  mappings: Record<string, Omit<FieldConfig, "displayName">> & {
    [K in string]?: FieldConfig;
  },
  endpoint: string,
  displayName: string
): EntityMapping {
  // Build final field mappings with auto-generated display names if not provided
  const finalFields: FieldMapping = {};
  for (const [fieldName, config] of Object.entries(mappings)) {
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
  };
}

/**
 * Utility to extract just the field mappings from an entity mapping
 * Useful for backward compatibility with code expecting plain field mappings
 */
export function getFieldMappings(entityMapping: EntityMapping): FieldMapping {
  return entityMapping.fields;
}
