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
  TextField,
} from "@mui/material";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { TableCard, type FloorPlanTable } from "./table-card";
import {
  useCreateFloorTable,
  useDeleteFloorTable,
  useFloorPlan,
  useUpdateFloorTable,
} from "@/hooks/orders/floor-hooks";
import { useCreateOrder } from "@/hooks/orders/order-hooks";
import { URLS } from "@/constants/urls";

interface ContextMenuState {
  anchorEl: HTMLElement | null;
  tableId: string | null;
}

export function FloorPlanDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useFloorPlan();
  const updateFloorTable = useUpdateFloorTable();
  const createFloorTable = useCreateFloorTable();
  const deleteFloorTable = useDeleteFloorTable();
  const createOrder = useCreateOrder();
  const [tables, setTables] = useState<FloorPlanTable[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    anchorEl: null,
    tableId: null,
  });
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [sourceTableId, setSourceTableId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState<number>(2);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDeleteId, setTableToDeleteId] = useState<string | null>(null);

  const handleTableClick = (table: FloorPlanTable) => {
    if (table.status === "AVAILABLE") {
      createOrder.mutate(
        { tableId: table.id },
        {
          onSuccess: (order) => {
            setTables((prev) =>
              prev.map((t) =>
                t.id === table.id
                  ? { ...t, status: "ACTIVE", orderId: order.id }
                  : t,
              ),
            );

            navigate({
              to: URLS.ORDER_VIEW(order.id),
            });
          },
          onError: () => {
            window.alert(
              "Could not open order for this table. Please check your permissions and try again.",
            );
          },
        },
      );
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
    // Only clear the anchor element so the menu closes immediately,
    // but keep the selected table id around so derived labels don't
    // momentarily fall back to defaults while the menu closes.
    setContextMenu((prev) => ({ anchorEl: null, tableId: prev.tableId }));
  };

  const handleToggleReserved = () => {
    const tableId = contextMenu.tableId;
    if (!tableId) return;

    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const nextReserved = !table.reserved;

    // Optimistic update
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, reserved: nextReserved } : t,
      ),
    );

    updateFloorTable.mutate({ tableId, reserved: nextReserved });
    closeContextMenu();
  };

  const handleOpenDeleteDialog = () => {
    if (!contextMenu.tableId) return;
    setTableToDeleteId(contextMenu.tableId);
    setDeleteDialogOpen(true);
    closeContextMenu();
  };

  const handleOpenMoveDialog = () => {
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

  const sourceTable = useMemo(
    () => tables.find((t) => t.id === sourceTableId) ?? null,
    [tables, sourceTableId],
  );

  const availableTargets = useMemo(
    () =>
      tables.filter(
        (t) =>
          t.id !== sourceTableId &&
          (t.status === "AVAILABLE" || (!t.orderId && t.status === "ACTIVE")),
      ),
    [tables, sourceTableId],
  );

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === contextMenu.tableId) ?? null,
    [tables, contextMenu.tableId],
  );

  const reservedMenuLabel = selectedTable?.reserved
    ? "Unmark as reserved"
    : "Mark as reserved";

  const handleDragStart = (
    _event: DragEvent<HTMLDivElement>,
    tableId: string,
  ) => {
    setDraggedTableId(tableId);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    // Allow dropping by preventing the default browser behavior
    event.preventDefault();
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetTableId: string,
  ) => {
    event.preventDefault();

    if (!draggedTableId || draggedTableId === targetTableId) {
      return;
    }

    setTables((prev) => {
      const sourceIndex = prev.findIndex((t) => t.id === draggedTableId);
      const targetIndex = prev.findIndex((t) => t.id === targetTableId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });

    setDraggedTableId(null);
  };

  // Sync local editable state from server data when it loads or changes
  useEffect(() => {
    if (data?.tables) {
      setTables(data.tables as FloorPlanTable[]);
    }
  }, [data]);

  const handleCreateTable = () => {
    if (!newTableLabel.trim() || newTableCapacity <= 0) return;

    createFloorTable.mutate(
      {
        label: newTableLabel.trim(),
        capacity: newTableCapacity,
      },
      {
        onSuccess: () => {
          setNewTableLabel("");
          setNewTableCapacity(2);
          setAddDialogOpen(false);
        },
        onError: () => {
          window.alert(
            "Could not create table. A table with this label may already exist.",
          );
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!tableToDeleteId) {
      setDeleteDialogOpen(false);
      return;
    }

    deleteFloorTable.mutate(
      { tableId: tableToDeleteId },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTableToDeleteId(null);
        },
        onError: () => {
          window.alert("Cannot delete a table that has an open order.");
        },
      },
    );
  };

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
        <Button
          variant="contained"
          onClick={() => setAddDialogOpen(true)}
          sx={{ alignSelf: "center" }}
        >
          Add Table
        </Button>
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
              onDragStart={(event) => handleDragStart(event, table.id)}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, table.id)}
            />
          ))}
        </Box>
      )}

      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={closeContextMenu}
      >
        <MenuItem onClick={handleOpenMoveDialog}>Move Table</MenuItem>
        <MenuItem onClick={handleToggleReserved}>{reservedMenuLabel}</MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>Delete Table</MenuItem>
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

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Table</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Label"
              value={newTableLabel}
              onChange={(event) => setNewTableLabel(event.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Capacity"
              type="number"
              value={newTableCapacity}
              onChange={(event) =>
                setNewTableCapacity(Number(event.target.value) || 0)
              }
              inputProps={{ min: 1, max: 20 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTable}
            variant="contained"
            disabled={!newTableLabel.trim() || newTableCapacity <= 0}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Table</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to delete this table?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
