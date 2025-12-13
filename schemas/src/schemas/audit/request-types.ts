import { z } from "zod";
import { PaginationSchema } from "../shared/request-types";
import { uuid } from "../shared/zod-utils";

export type AuditBusinessLogQuery = z.infer<typeof AuditBusinessLogQuerySchema>;
export type AuditSecurityLogQuery = z.infer<typeof AuditSecurityLogQuerySchema>;

export const AuditBusinessLogIdParam = z.object({ businessLogId: uuid() });
export const AuditSecurityLogIdParam = z.object({ securityLogId: uuid() });

export const AuditBusinessLogQuerySchema = PaginationSchema.extend({
  userId: uuid().optional(),
  userEmail: z.string().optional(),
  businessId: uuid().optional(),
  entityType: z.string().optional(),
  entityId: uuid().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const AuditSecurityLogQuerySchema = PaginationSchema.extend({
  userId: uuid().optional(),
  userEmail: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
