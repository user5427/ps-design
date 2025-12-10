import { Box, Paper, Typography, Chip } from "@mui/material";
import type { MouseEvent } from "react";

export type TableStatus = "AVAILABLE" | "ACTIVE" | "ATTENTION";

export interface FloorPlanTable {
  id: string;
  label: string;
  capacity: number;
  status: TableStatus;
  reserved?: boolean;
  orderId?: string;
}

interface TableCardProps {
  table: FloorPlanTable;
  onClick: () => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
}

function getBackgroundColor(status: TableStatus, reserved?: boolean): string {
  // Reserved but not yet seated tables get their own highlight
  if (reserved && status === "AVAILABLE") {
    return "#BBDEFB"; // Light blue for reserved tables without an order
  }

  switch (status) {
    case "ACTIVE":
      return "#2ECC71"; // Green for tables with an open order
    case "ATTENTION":
      return "#F39C12"; // Orange for tables that need attention
    default:
      return "#F5F5F5"; // Light gray / white for free tables
  }
}

function getTextColor(status: TableStatus, reserved?: boolean): string {
  if (reserved && status === "AVAILABLE") {
    return "#000000";
  }

  switch (status) {
    case "ACTIVE":
    case "ATTENTION":
      return "#FFFFFF";
    case "AVAILABLE":
    default:
      return "#000000";
  }
}

export function TableCard({ table, onClick, onContextMenu }: TableCardProps) {
  const backgroundColor = getBackgroundColor(table.status, table.reserved);
  const textColor = getTextColor(table.status, table.reserved);

  return (
    <Paper
      onClick={onClick}
      onContextMenu={onContextMenu}
      elevation={2}
      sx={{
        width: 140,
        height: 140,
        borderRadius: 2,
        p: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: backgroundColor,
        color: textColor,
        cursor: "pointer",
        position: "relative",
        userSelect: "none",
      }}
    >
      {table.reserved && (
        <Chip
          label="Reserved"
          size="small"
          color="secondary"
          sx={{ position: "absolute", top: 6, right: 6 }}
        />
      )}

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 0.5,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            hyphens: "auto",
            display: "block",
          }}
        >
          {table.label}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ mb: 0.5 }}>
        {table.capacity} seats
      </Typography>
    </Paper>
  );
}
