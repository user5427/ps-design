import { apiClient } from "@/api/client";
import type {
  AuditBusinessLogQuery,
  AuditBusinessLogResponse,
  PaginatedAuditBusinessLogResponse,
  AuditSecurityLogQuery,
  AuditSecurityLogResponse,
  PaginatedAuditSecurityLogResponse,
} from "@ps-design/schemas/audit";

export async function getAuditBusinessLogs(
  query: AuditBusinessLogQuery,
): Promise<PaginatedAuditBusinessLogResponse> {
  const response = await apiClient.get<PaginatedAuditBusinessLogResponse>(
    "/audit/business",
    { params: query },
  );

  return response.data;
}

export async function getAuditBusinessLog(
  id: string,
): Promise<AuditBusinessLogResponse> {
  const response = await apiClient.get<AuditBusinessLogResponse>(
    `/audit/business/${id}`,
  );

  return response.data;
}

export async function getAuditSecurityLogs(
  query: AuditSecurityLogQuery,
): Promise<PaginatedAuditSecurityLogResponse> {
  const response = await apiClient.get<PaginatedAuditSecurityLogResponse>(
    "/audit/security",
    { params: query },
  );

  return response.data;
}

export async function getAuditSecurityLog(
  id: string,
): Promise<AuditSecurityLogResponse> {
  const response = await apiClient.get<AuditSecurityLogResponse>(
    `/audit/security/${id}`,
  );

  return response.data;
}
