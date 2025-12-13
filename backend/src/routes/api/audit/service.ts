import type { FastifyInstance } from "fastify";
import type {
  AuditBusinessLogQuery,
  AuditSecurityLogQuery,
  AuditBusinessLogResponse,
  AuditSecurityLogResponse,
  PaginatedAuditBusinessLogResponse,
  PaginatedAuditSecurityLogResponse,
} from "@ps-design/schemas/audit";
import type { AuditBusinessLog } from "@/modules/audit/audit-business-log.entity";
import type { AuditSecurityLog } from "@/modules/audit/audit-security-log.entity";

async function toAuditBusinessLogResponse(
  fastify: FastifyInstance,
  log: AuditBusinessLog,
): Promise<AuditBusinessLogResponse> {
  const user = log.userId ? await fastify.db.user.findById(log.userId) : null;
  return {
    id: log.id,
    businessId: log.businessId,
    userId: log.userId,
    userEmail: user ? user.email : null, 
    ip: log.ip,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    oldValues: log.oldValues,
    newValues: log.newValues,
    result: log.result,
    createdAt: log.createdAt.toISOString(),
  };
}

export async function getAuditBusinessLogs(
  fastify: FastifyInstance,
  query: AuditBusinessLogQuery,
): Promise<PaginatedAuditBusinessLogResponse> {
  const { items, total } =
    await fastify.db.auditLogRepository.findPaginatedBusinessLogs(query);

  return {
    items: await Promise.all(items.map(log => toAuditBusinessLogResponse(fastify, log))),
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit),
  };
}

export async function getAuditBusinessLogById(
  fastify: FastifyInstance,
  id: string,
): Promise<AuditBusinessLogResponse> {
  const log = await fastify.db.auditLogRepository.getBusinessLogById(id);
  return await toAuditBusinessLogResponse(fastify, log);
}

async function toAuditSecurityLogResponse(
  fastify: FastifyInstance,
  log: AuditSecurityLog,
): Promise<AuditSecurityLogResponse> {
  const user = log.userId ? await fastify.db.user.findById(log.userId) : null;
  return {
    id: log.id,
    userId: log.userId,
    userEmail: user ? user.email : null,
    ip: log.ip,
    action: log.action,
    result: log.result,
    createdAt: log.createdAt.toISOString(),
  };
}

export async function getAuditSecurityLogs(
  fastify: FastifyInstance,
  query: AuditSecurityLogQuery,
): Promise<PaginatedAuditSecurityLogResponse> {
  const { items, total } =
    await fastify.db.auditLogRepository.findPaginatedSecurityLogs(query);

  return {
    items: await Promise.all(items.map(log => toAuditSecurityLogResponse(fastify, log))),
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit),
  };
}

export async function getAuditSecurityLogById(
  fastify: FastifyInstance,
  id: string,
): Promise<AuditSecurityLogResponse> {
  const log = await fastify.db.auditLogRepository.getSecurityLogById(id);
  return await toAuditSecurityLogResponse(fastify, log);
}
