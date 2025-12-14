import { useMemo } from "react";
import { Chip } from "@mui/material";
import {
  RecordListView,
  type ViewFieldDefinition,
} from "@/components/elements/record-list-view";
import { useAuditSecurityLogs } from "@/hooks/audit";
import type { AuditSecurityLogResponse } from "@/schemas/audit";

export const AuditSecurityLogsListView = () => {
  const { data, isLoading, error, refetch } = useAuditSecurityLogs();
  const logs = data?.items ?? [];

  const { columns, viewFields } = useMemo(() => {
    if (!logs.length) return { columns: [], viewFields: [] };

    const firstItem = logs[0];

    const dynamicKeys = Object.keys(firstItem).filter(
      (key) =>
        key.toLowerCase() !== "oldvalues" &&
        key.toLowerCase() !== "newvalues" &&
        !key.toLowerCase().endsWith("id") &&
        key.toLowerCase() !== "ip",
    );

    const cols = dynamicKeys.map((key) => ({
      accessorKey: key,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase()),
      size: 150,
      Cell: ({ cell }: any) => {
        const value = cell.getValue();

        if (key.toLowerCase() === "result") {
          const label = String(value ?? "").toUpperCase();
          return (
            <Chip
              label={label === "SUCCESS" ? "Success" : "Failure"}
              size="small"
              color={label === "SUCCESS" ? "success" : "error"}
              sx={{ color: "common.white", fontWeight: 300 }}
            />
          );
        }

        if (value && typeof value === "object") {
          return (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }

        if (
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("createdat")
        ) {
          return value ? new Date(value).toLocaleString() : "-";
        }

        return value ?? "-";
      },
    }));

    const views: ViewFieldDefinition[] = Object.keys(firstItem).map((key) => ({
      name: key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase()),
      render: (value: any) => {
        if (value && typeof value === "object") {
          return (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }

        if (
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("createdat")
        ) {
          return value ? new Date(value).toLocaleString() : "-";
        }

        return value ?? "-";
      },
    }));

    return { columns: cols, viewFields: views };
  }, [logs]);

  return (
    <RecordListView<AuditSecurityLogResponse>
      title="Security Audit Logs"
      columns={columns}
      data={logs}
      isLoading={isLoading}
      error={error}
      viewFields={viewFields}
      onSuccess={() => refetch()}
      hasViewAction
    />
  );
};
