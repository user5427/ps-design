import { useQuery } from "@tanstack/react-query";
import {
  getAuditBusinessLogs,
  getAuditBusinessLog,
  getAuditSecurityLogs,
  getAuditSecurityLog,
} from "@/api/audit";
import type {
  AuditBusinessLogQuery,
  AuditBusinessLogResponse,
  PaginatedAuditBusinessLogResponse,
  AuditSecurityLogQuery,
  AuditSecurityLogResponse,
  PaginatedAuditSecurityLogResponse,
} from "@/schemas/audit";

export const auditBusinessLogKeys = {
  all: ["audit", "business-logs"] as const,
  lists: (query: AuditBusinessLogQuery) => [
    ...auditBusinessLogKeys.all,
    { query },
  ],
  detail: (id: string) => [...auditBusinessLogKeys.all, "detail", id] as const,
};

export function useAuditBusinessLogs(query?: Partial<AuditBusinessLogQuery>) {
  return useQuery<PaginatedAuditBusinessLogResponse>({
    queryKey: query
      ? auditBusinessLogKeys.lists(query as AuditBusinessLogQuery)
      : auditBusinessLogKeys.all,
    queryFn: () =>
      getAuditBusinessLogs({
        page: 1,
        limit: 20,
        ...query,
      }),
    refetchOnMount: "always",
  });
}

export function useAuditBusinessLog(id: string) {
  return useQuery<AuditBusinessLogResponse>({
    queryKey: auditBusinessLogKeys.detail(id),
    queryFn: () => getAuditBusinessLog(id),
    enabled: !!id,
  });
}

export const auditSecurityLogKeys = {
  all: ["audit", "security-logs"] as const,
  lists: (query: AuditSecurityLogQuery) => [
    ...auditSecurityLogKeys.all,
    { query },
  ],
  detail: (id: string) => [...auditSecurityLogKeys.all, "detail", id] as const,
};

export function useAuditSecurityLogs(query?: Partial<AuditSecurityLogQuery>) {
  return useQuery<PaginatedAuditSecurityLogResponse>({
    queryKey: query
      ? auditSecurityLogKeys.lists(query as AuditSecurityLogQuery)
      : auditSecurityLogKeys.all,
    queryFn: () =>
      getAuditSecurityLogs({
        page: 1,
        limit: 20,
        ...query,
      }),
    refetchOnMount: "always",
  });
}

export function useAuditSecurityLog(id: string) {
  return useQuery<AuditSecurityLogResponse>({
    queryKey: auditSecurityLogKeys.detail(id),
    queryFn: () => getAuditSecurityLog(id),
    enabled: !!id,
  });
}
