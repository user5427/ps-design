import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TableCard, type FloorPlanTable } from "./table-card";
import { useFloorPlan, useUpdateFloorTable } from "@/hooks/orders/floor-hooks";
import { URLS } from "@/constants/urls";

interface ContextMenuState {
  anchorEl: HTMLElement | null;
  tableId: string | null;
}

export function FloorPlanDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useFloorPlan();
  const updateFloorTable = useUpdateFloorTable();
  const [tables, setTables] = useState<FloorPlanTable[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    anchorEl: null,
    tableId: null,
  });
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [sourceTableId, setSourceTableId] = useState<string | null>(null);

  const handleTableClick = (table: FloorPlanTable) => {
    if (table.status === "AVAILABLE") {
      const newOrderId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `order-${Date.now()}`;

      setTables((prev) =>
        prev.map((t) =>
          t.id === table.id
            ? { ...t, status: "ACTIVE", orderId: newOrderId }
            : t,
        ),
      );

      navigate({
        to: URLS.ORDER_VIEW(newOrderId),
      });
      return;
    }

    if (
      (table.status === "ACTIVE" || table.status === "ATTENTION") &&
      table.orderId
    ) {
      navigate({ to: URLS.ORDER_VIEW(table.orderId) });
    }
  };

  const handleTableContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    table: FloorPlanTable,
  ) => {
    event.preventDefault();
    setContextMenu({ anchorEl: event.currentTarget, tableId: table.id });
  };

  const closeContextMenu = () => {
    setContextMenu({ anchorEl: null, tableId: null });
  };

  const toggleReserved = () => {
    if (!contextMenu.tableId) return;
    const table = tables.find((t) => t.id === contextMenu.tableId);
    if (!table) return;

    const nextReserved = !table.reserved;

    // Optimistic UI update
    setTables((prev) =>
      prev.map((t) =>
        t.id === contextMenu.tableId ? { ...t, reserved: nextReserved } : t,
      ),
    );

    updateFloorTable.mutate({
      tableId: contextMenu.tableId,
      reserved: nextReserved,
    });
    closeContextMenu();
  };

  const openMoveDialog = () => {
    if (!contextMenu.tableId) return;
    setSourceTableId(contextMenu.tableId);
    setMoveDialogOpen(true);
    closeContextMenu();
  };

  const handleMoveToTable = (targetId: string) => {
    if (!sourceTableId || sourceTableId === targetId) {
      setMoveDialogOpen(false);
      return;
    }

    setTables((prev) => {
      const source = prev.find((t) => t.id === sourceTableId);
      if (!source || !source.orderId) {
        return prev;
      }

      return prev.map((t) => {
        if (t.id === sourceTableId) {
          return { ...t, status: "AVAILABLE", orderId: undefined };
        }
        if (t.id === targetId) {
          return { ...t, status: "ACTIVE", orderId: source.orderId };
        }
        return t;
      });
    });

    setMoveDialogOpen(false);
  };

  const sourceTable = tables.find((t) => t.id === sourceTableId) ?? null;

  const availableTargets = tables.filter(
    (t) =>
      t.id !== sourceTableId &&
      (t.status === "AVAILABLE" || (!t.orderId && t.status === "ACTIVE")),
  );

  // Sync local editable state from server data when it loads or changes
  useEffect(() => {
    if (data?.tables) {
      setTables(data.tables as FloorPlanTable[]);
    }
  }, [data]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Floor Plan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tap a table to open or create an order. Right-click (or long press)
            for more options.
          </Typography>
        </Box>
      </Stack>

      {isLoading ? (
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 2,
          }}
        >
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => handleTableClick(table)}
              onContextMenu={(event) => handleTableContextMenu(event, table)}
            />
          ))}
        </Box>
      )}

      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={closeContextMenu}
      >
        <MenuItem onClick={openMoveDialog}>Move Table</MenuItem>
        <MenuItem onClick={toggleReserved}>Mark as Reserved</MenuItem>
      </Menu>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}>
        <DialogTitle>Move Table</DialogTitle>
        <DialogContent>
          {sourceTable ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Move order from table {sourceTable.label} to:
            </Typography>
          ) : null}
          <Stack spacing={1} sx={{ mt: 1 }}>
            {availableTargets.map((table) => (
              <Button
                key={table.id}
                variant="outlined"
                onClick={() => handleMoveToTable(table.id)}
              >
                {table.label} ({table.capacity} seats)
              </Button>
            ))}
            {availableTargets.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No available target tables.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
