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

