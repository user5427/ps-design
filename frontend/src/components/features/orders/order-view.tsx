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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useFloorPlan } from "@/hooks/orders/floor-hooks";
import { URLS } from "@/constants/urls";

type TicketItemStatus = "UNSENT" | "SENT";

interface TicketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: TicketItemStatus;
}

interface MenuItemEntry {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

const INITIAL_MENU_ITEMS: MenuItemEntry[] = [
  { id: "m1", name: "Bruschetta", price: 6.5, category: "Starters", stock: 10 },
  {
    id: "m2",
    name: "Caesar Salad",
    price: 8.9,
    category: "Starters",
    stock: 5,
  },
  {
    id: "m3",
    name: "Margherita Pizza",
    price: 12.5,
    category: "Mains",
    stock: 8,
  },
  {
    id: "m4",
    name: "Grilled Salmon",
    price: 18.9,
    category: "Mains",
    stock: 3,
  },
  { id: "m5", name: "Tiramisu", price: 7.0, category: "Desserts", stock: 0 },
  { id: "m6", name: "Espresso", price: 2.5, category: "Drinks", stock: 20 },
  {
    id: "m7",
    name: "House Red Wine",
    price: 4.5,
    category: "Drinks",
    stock: 0,
  },
];

const MENU_CATEGORIES = [
  "All",
  "Starters",
  "Mains",
  "Desserts",
  "Drinks",
] as const;

type MenuCategory = (typeof MENU_CATEGORIES)[number];

type OrderUiStatus = "NEW" | "ACTIVE";

interface OrderViewProps {
  orderId: string;
}

export const OrderView: React.FC<OrderViewProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const { data: floorData } = useFloorPlan();

  const [orderStatus, setOrderStatus] = useState<OrderUiStatus>(
    orderId ? "ACTIVE" : "NEW",
  );
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [servedBy] = useState<string>("Demo Waiter");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategory>("All");

  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);

  // Derive table label from floor plan data when available
  const matchingTable = useMemo(() => {
    if (!floorData?.tables?.length) return null;
    return floorData.tables.find((t) => t.orderId === orderId) ?? null;
  }, [floorData, orderId]);

  if (!tableLabel && matchingTable) {
    setTableLabel(matchingTable.label);
  }

  const filteredMenuItems = useMemo(() => {
    return INITIAL_MENU_ITEMS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!search.trim()) return true;
      return item.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [category, search]);

  const total = useMemo(
    () =>
      ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [ticketItems],
  );

  const handleBack = () => {
    navigate({ to: URLS.FLOOR_PLAN });
  };

  const handleAddMenuItem = (menuItem: MenuItemEntry) => {
    if (menuItem.stock === 0) return;

    setTicketItems((prev) => {
      const existing = prev.find(
        (item) => item.id === menuItem.id && item.status === "UNSENT",
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          status: "UNSENT",
        },
      ];
    });
  };

  const handleChangeQuantity = (itemId: string, delta: number) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId || item.status === "SENT") return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        })
        .filter((x): x is TicketItem => x !== null),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setTicketItems((prev) =>
      prev.filter((item) => item.id !== itemId || item.status === "SENT"),
    );
  };

  const handlePrimaryAction = () => {
    if (orderStatus === "NEW") {
      setOrderStatus("ACTIVE");
      return;
    }

    if (orderStatus === "ACTIVE") {
      setTicketItems((prev) =>
        prev.map((item) =>
          item.status === "UNSENT" ? { ...item, status: "SENT" } : item,
        ),
      );
    }
  };

  const handleCancelOrder = () => {
    const confirmed = window.confirm("Cancel this order and discard changes?");
    if (!confirmed) return;
    setTicketItems([]);
    setOrderStatus("NEW");
    navigate({ to: URLS.FLOOR_PLAN });
  };

  const handlePrintBill = () => {
    // Placeholder for actual print integration
    // eslint-disable-next-line no-console
    console.log("Print bill for order", orderId || "(unsaved)");
  };

  const primaryLabel =
    orderStatus === "NEW" ? "Create Order" : "Send to Kitchen";

  const statusChipColor = orderStatus === "NEW" ? "default" : "success";

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
              label={orderStatus}
              color={statusChipColor}
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
            {MENU_CATEGORIES.map((cat) => (
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
            {ticketItems.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No items yet. Tap items on the left to add them.
              </Typography>
            )}

            {ticketItems.map((item) => {
              const isSent = item.status === "SENT";
              return (
                <Box
                  key={`${item.id}-${item.status}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                    opacity: isSent ? 0.6 : 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => handleChangeQuantity(item.id, -1)}
                        disabled={isSent}
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
                        disabled={isSent}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Box>
                      <Typography variant="body2">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(item.price * item.quantity).toFixed(2)}€
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    {isSent ? (
                      <Chip label="Sent" size="small" color="default" />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="Remove item from ticket"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
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
                    orderStatus === "ACTIVE" &&
                    ticketItems.every((i) => i.status === "SENT")
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
