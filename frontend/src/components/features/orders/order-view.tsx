import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useFloorPlan } from "@/hooks/orders/floor-hooks";
import { URLS } from "@/constants/urls";
import { useOrder, useSendOrderItems, useUpdateOrderItems } from "@/hooks/orders/order-hooks";
import { useMenuItems } from "@/hooks/menu";
import type { OrderItemInput } from "@ps-design/schemas/order/order";

interface MenuItemEntry {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  quantity: number;
  status?: "UNSENT" | "SENT";
}
type MenuCategory = string;

interface OrderViewProps {
  orderId: string;
}

export const OrderView: React.FC<OrderViewProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const { data: floorData } = useFloorPlan();
  const { data: order, isLoading } = useOrder(orderId);
  const { data: menuItems, isLoading: isMenuLoading } = useMenuItems();
  const updateItemsMutation = useUpdateOrderItems(orderId);
  const sendItemsMutation = useSendOrderItems(orderId);

  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [servedBy] = useState<string>("Demo Waiter");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategory>("All");

  const [ticketItems, setTicketItems] = useState<MenuItemEntry[]>([]);

  // Derive table label from floor plan data when available
  const matchingTable = useMemo(() => {
    if (!floorData?.tables?.length) return null;
    return floorData.tables.find((t) => t.orderId === orderId) ?? null;
  }, [floorData, orderId]);

  if (!tableLabel && matchingTable) {
    setTableLabel(matchingTable.label);
  }

  const menuEntries: MenuItemEntry[] = useMemo(() => {
    if (!menuItems) return [];

    return menuItems.map((item) => ({
      id: item.id,
      name: item.baseName,
      price: item.basePrice / 100,
      category: item.category?.name ?? "Other",
      stock: item.isAvailable ? 999 : 0,
      quantity: 0,
    }));
  }, [menuItems]);

  const menuCategories: MenuCategory[] = useMemo(() => {
    const set = new Set<string>();
    menuEntries.forEach((item) => set.add(item.category));
    return ["All", ...Array.from(set).sort()];
  }, [menuEntries]);

  const filteredMenuItems = useMemo(() => {
    return menuEntries.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!search.trim()) return true;
      return item.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [menuEntries, category, search]);

  const total = useMemo(() => order?.totalAmount ?? 0, [order]);

  const handleBack = () => {
    navigate({ to: URLS.FLOOR_PLAN });
  };

  const handleAddMenuItem = (menuItem: MenuItemEntry) => {
    if (menuItem.stock === 0) return;
    setTicketItems((prev) => {
      const existing = prev.find((item) => item.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const handleChangeQuantity = (itemId: string, delta: number) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        })
        .filter((x): x is MenuItemEntry => x !== null),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handlePrimaryAction = () => {
    if (ticketItems.length === 0) return;

    const itemsInput: OrderItemInput[] = ticketItems.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      variationIds: [],
    }));

    updateItemsMutation.mutate(
      { items: itemsInput },
      {
        onSuccess: () => {
          sendItemsMutation.mutate(undefined, {
            onSuccess: () => {
              // Clear local pending ticket after successful send
              setTicketItems([]);
            },
          });
        },
      },
    );
  };

  const handleCancelOrder = () => {
    const confirmed = window.confirm("Cancel this order and discard changes?");
    if (!confirmed) return;
    navigate({ to: URLS.FLOOR_PLAN });
  };

  const handlePrintBill = () => {
    // Placeholder for actual print integration
    // eslint-disable-next-line no-console
    console.log("Print bill for order", orderId || "(unsaved)");
  };

  const primaryLabel =
    "Send to Kitchen";

  if (isLoading || isMenuLoading || !order) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ px: 2 }}>
            <IconButton
              edge="start"
              onClick={handleBack}
              aria-label="Back to floor plan"
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, ml: 2 }}>
              <Typography variant="h6">
                {tableLabel ? `Table ${tableLabel}` : "Order"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order {orderId || "(new)"}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Divider />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel A: Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ px: 2 }}>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="Back to floor plan"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography variant="h6">
              {tableLabel ? `Table ${tableLabel}` : "Order"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order {orderId || "(new)"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={order.status}
              color="default"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              Served by {servedBy}
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      <Divider />

      {/* Main split layout: Menu (left) and Ticket (right) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Panel B: Menu */}
        <Box
          sx={{
            flexBasis: { xs: "50%", md: "55%" },
            borderRight: { md: 1, xs: 0 },
            borderColor: "divider",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search menu"
            placeholder="e.g. Bruschetta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Tabs
            value={category}
            onChange={(_, value: MenuCategory) => setCategory(value)}
            sx={{ mt: 1 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {menuCategories.map((cat) => (
              <Tab key={cat} label={cat} value={cat} />
            ))}
          </Tabs>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 2,
              overflowY: "visible",
            }}
          >
            {filteredMenuItems.map((item) => {
              const isSoldOut = item.stock === 0;
              return (
                <Paper
                  key={item.id}
                  elevation={2}
                  onClick={() => !isSoldOut && handleAddMenuItem(item)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: isSoldOut ? "default" : "pointer",
                    opacity: isSoldOut ? 0.5 : 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 96,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {item.price.toFixed(2)}€
                  </Typography>
                  {isSoldOut && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(0,0,0,0.7)",
                        color: "white",
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: "0.7rem",
                      }}
                    >
                      Sold Out
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        </Box>

        {/* Panel C + D: Ticket and footer */}
        <Box
          sx={{
            flexBasis: { xs: "50%", md: "45%" },
            p: 2,
            display: "flex",
            flexDirection: "column",
            maxHeight: { xs: "50vh", md: "100%" },
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Current Ticket
          </Typography>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              pr: 1,
            }}
          >
            {order.orderItems.length === 0 && ticketItems.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No items yet. Tap items on the left to add them.
              </Typography>
            )}

            {/* Pending items not yet sent to kitchen */}
            {ticketItems.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <Box
                  key={`pending-${item.id}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => handleChangeQuantity(item.id, -1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{ width: 24, textAlign: "center" }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleChangeQuantity(item.id, 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Box>
                      <Typography variant="body2">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lineTotal.toFixed(2)}€
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label="New" size="small" color="primary" />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label="Remove item from ticket"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}

            {/* Items that have already been sent to the kitchen */}
            {order.orderItems.map((item) => {
              if (item.status !== "SENT") return null;

              return (
                <Box
                  key={`sent-${item.id}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                    opacity: 0.6,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{ width: 24, textAlign: "center" }}
                    >
                      {item.quantity}
                    </Typography>
                    <Box>
                      <Typography variant="body2">{item.snapName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.lineTotal.toFixed(2)}€
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label="Sent" size="small" color="default" />
                  </Stack>
                </Box>
              );
            })}
          </Box>

          {/* Panel D: Action footer */}
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6">Total: {total.toFixed(2)}€</Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePrimaryAction}
                  disabled={
                    ticketItems.length === 0 ||
                    updateItemsMutation.isPending ||
                    sendItemsMutation.isPending
                  }
                >
                  {primaryLabel}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
                <Button variant="outlined" onClick={handlePrintBill}>
                  Print Bill
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
