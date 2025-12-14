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
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { floorKeys, useFloorPlan } from "@/hooks/orders/floor-hooks";
import { URLS } from "@/constants/urls";
import {
  useCancelOrder,
  useOrder,
  usePayOrder,
  useRefundOrder,
  useSendOrderItems,
  useUpdateOrderItems,
  useUpdateOrderTotals,
} from "@/hooks/orders/order-hooks";
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
  const queryClient = useQueryClient();
  const { data: floorData } = useFloorPlan();
  const { data: order, isLoading } = useOrder(orderId);
  const { data: menuItems, isLoading: isMenuLoading } = useMenuItems();
  const updateItemsMutation = useUpdateOrderItems(orderId);
  const sendItemsMutation = useSendOrderItems(orderId);
  const updateTotalsMutation = useUpdateOrderTotals(orderId);
  const payOrderMutation = usePayOrder(orderId);
  const refundOrderMutation = useRefundOrder(orderId);
  const cancelOrderMutation = useCancelOrder(orderId);

  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [servedBy] = useState<string>("Demo Waiter");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategory>("All");

  const [ticketItems, setTicketItems] = useState<MenuItemEntry[]>([]);

  const [tipInput, setTipInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("");
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>("");

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
    menuEntries.forEach((item) => {
      set.add(item.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [menuEntries]);

  const filteredMenuItems = useMemo(() => {
    return menuEntries.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!search.trim()) return true;
      return item.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [menuEntries, category, search]);

  const pendingItemsTotal = useMemo(
    () =>
      ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [ticketItems],
  );

  const committedBaseTotal = order
    ? order.itemsTotal + order.totalTax + order.totalTip - order.totalDiscount
    : 0;

  const total = committedBaseTotal + pendingItemsTotal;

  const payments = order?.payments ?? [];
  const totalPaid = payments
    .filter((p) => !p.isRefund)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.isRefund)
    .reduce((sum, p) => sum + p.amount, 0);
  const netPaid = totalPaid - totalRefunded;
  const remaining = Math.max(0, total - netPaid);

  const isOpen = order?.status === "OPEN";

  useEffect(() => {
    if (!order) return;

    setTipInput(order.totalTip.toFixed(2));
    setDiscountInput(order.totalDiscount.toFixed(2));

    const suggested = remaining > 0 ? remaining : order.totalAmount;
    setPaymentAmountInput(suggested.toFixed(2));
  }, [order, remaining]);

  const handleBack = () => {
    navigate({ to: URLS.FLOOR_PLAN });
  };

  const handleAddMenuItem = (menuItem: MenuItemEntry) => {
    if (!isOpen) return;
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
    if (!isOpen) return;

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
    if (!isOpen) return;
    setTicketItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handlePrimaryAction = () => {
    if (!isOpen) return;
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
    if (!isOpen) {
      window.alert("Only open orders can be cancelled.");
      return;
    }

    const confirmed = window.confirm("Cancel this order and discard changes?");
    if (!confirmed) return;

    cancelOrderMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: floorKeys.floorPlan() });
        navigate({ to: URLS.FLOOR_PLAN });
      },
      onError: () => {
        window.alert(
          "Could not cancel this order. It may already have payments.",
        );
      },
    });
  };

  const handlePrintBill = () => {
    if (!order) return;

    // For now, trigger the browser print dialog so the
    // current order view (items, totals, payments) can
    // be printed as a receipt.
    window.print();
  };

  const parseMoneyInput = (value: string): number => {
    const normalized = value.replace(",", ".");
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleUpdateTotals = () => {
    if (!order) return;
    if (!isOpen) {
      window.alert("Only open orders can be updated.");
      return;
    }

    const tipAmount = Math.max(0, parseMoneyInput(tipInput));
    const discountAmount = Math.max(0, parseMoneyInput(discountInput));

    updateTotalsMutation.mutate(
      { tipAmount, discountAmount },
      {
        onError: () => {
          window.alert("Could not update totals. Please try again.");
        },
      },
    );
  };

  const handleAddPayment = (method: "CASH" | "CARD" | "GIFT_CARD") => {
    if (!order) return;

    const amount = parseMoneyInput(paymentAmountInput);
    if (amount <= 0) {
      window.alert("Enter a valid payment amount.");
      return;
    }

    payOrderMutation.mutate(
      { paymentMethod: method, amount },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: floorKeys.floorPlan() });
        },
        onError: () => {
          window.alert("Could not register payment. Please try again.");
        },
      },
    );
  };

  const handleRefund = () => {
    if (!order) return;

    const amount = parseMoneyInput(paymentAmountInput);
    if (amount <= 0) {
      window.alert("Enter a valid refund amount.");
      return;
    }

    refundOrderMutation.mutate(
      { amount },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: floorKeys.floorPlan() });
        },
        onError: () => {
          window.alert("Could not refund this order.");
        },
      },
    );
  };

  const primaryLabel = "Send to Kitchen";

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
              color={
                order.status === "OPEN"
                  ? "primary"
                  : order.status === "PAID"
                    ? "success"
                    : order.status === "CANCELLED"
                      ? "error"
                      : "warning"
              }
              variant={order.status === "OPEN" ? "outlined" : "filled"}
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

          {/* Payments and totals panel */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle2">Summary</Typography>
                  <Typography variant="body2">
                    Items: {(order.itemsTotal + pendingItemsTotal).toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Tax: {order.totalTax.toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Tip: {order.totalTip.toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Discount: -{order.totalDiscount.toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Total: {total.toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Paid: {netPaid.toFixed(2)}€
                  </Typography>
                  <Typography variant="body2">
                    Due: {remaining.toFixed(2)}€
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2">Tip & discount</Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 0.5 }}
                  >
                    <TextField
                      label="Tip (€)"
                      size="small"
                      value={tipInput}
                      onChange={(e) => setTipInput(e.target.value)}
                      disabled={!isOpen || updateTotalsMutation.isPending}
                      sx={{ minWidth: 100 }}
                    />
                    <TextField
                      label="Discount (€)"
                      size="small"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      disabled={!isOpen || updateTotalsMutation.isPending}
                      sx={{ minWidth: 120 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleUpdateTotals}
                      disabled={!isOpen || updateTotalsMutation.isPending}
                    >
                      Save
                    </Button>
                  </Stack>
                </Box>
              </Stack>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Payments
                </Typography>
                {payments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No payments yet.
                  </Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {payments.map((p) => (
                      <Typography key={p.id} variant="body2">
                        {p.method} {p.isRefund ? "refund" : "payment"} —{" "}
                        {p.amount.toFixed(2)}€ on{" "}
                        {new Date(p.createdAt).toLocaleString()}
                      </Typography>
                    ))}
                  </Stack>
                )}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ mt: 1 }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <TextField
                    label="Amount (€)"
                    size="small"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    sx={{ minWidth: 140 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddPayment("CASH")}
                      disabled={payOrderMutation.isPending}
                    >
                      Cash
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddPayment("CARD")}
                      disabled={payOrderMutation.isPending}
                    >
                      Card
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddPayment("GIFT_CARD")}
                      disabled={payOrderMutation.isPending}
                    >
                      Gift card
                    </Button>
                  </Stack>
                  {(order.status === "PAID" || order.status === "REFUNDED") && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={handleRefund}
                      disabled={refundOrderMutation.isPending}
                    >
                      Refund
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
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
                    !isOpen ||
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
                  disabled={!isOpen || cancelOrderMutation.isPending}
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
