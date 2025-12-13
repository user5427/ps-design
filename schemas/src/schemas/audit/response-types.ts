import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";
import { PaginationMetaSchema } from "../shared/response-types";

export type AuditBusinessLogResponse = z.infer<
  typeof AuditBusinessLogResponseSchema
>;
export type PaginatedAuditBusinessLogResponse = z.infer<
  typeof PaginatedAuditBusinessLogResponseSchema
>;
export type AuditSecurityLogResponse = z.infer<
  typeof AuditSecurityLogResponseSchema
>;
export type PaginatedAuditSecurityLogResponse = z.infer<
  typeof PaginatedAuditSecurityLogResponseSchema
>;

export const AuditBusinessLogResponseSchema = z.object({
  id: uuid(),
  businessId: uuid().nullable(),
  userId: uuid().nullable(),
  userEmail: z.string().nullable(),
  ip: z.string().nullable(),
  entityType: z.string(),
  entityId: uuid(),
  action: z.string(),
  oldValues: z.record(z.string(), z.any()).nullable(),
  newValues: z.record(z.string(), z.any()).nullable(),
  result: z.string().nullable(),
  createdAt: datetime(),
});

export const PaginatedAuditBusinessLogResponseSchema = z.object({
  items: z.array(AuditBusinessLogResponseSchema),
  ...PaginationMetaSchema.shape,
});

export const AuditSecurityLogResponseSchema = z.object({
  id: uuid(),
  userId: uuid().nullable(),
  userEmail: z.string().nullable(),
  ip: z.string().nullable(),
  action: z.string(),
  result: z.string().nullable(),
  createdAt: datetime(),
});

export const PaginatedAuditSecurityLogResponseSchema = z.object({
  items: z.array(AuditSecurityLogResponseSchema),
  ...PaginationMetaSchema.shape,
});
