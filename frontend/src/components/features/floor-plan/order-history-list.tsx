import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Chip,
    TablePagination,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useOrderHistory } from "@/hooks/orders/order-hooks";
import { URLS } from "@/constants/urls";
import type { OrderSummary } from "@ps-design/schemas/order/order";

const statusColors: Record<string, "success" | "error" | "warning" | "default"> = {
    PAID: "success",
    CANCELLED: "error",
    REFUNDED: "warning",
    OPEN: "default",
};

export function OrderHistoryList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const { data, isLoading } = useOrderHistory(undefined, page, rowsPerPage);

    const handleViewOrder = (orderId: string) => {
        navigate({ to: URLS.ORDER_VIEW(orderId) });
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage + 1); // MUI TablePagination is 0-indexed
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatCurrency = (amount: number) => {
        return `€${amount.toFixed(2)}`;
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const orders = data?.data ?? [];
    const total = data?.pagination?.total ?? 0;

    if (orders.length === 0) {
        return (
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    No order history available.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Table</TableCell>
                            <TableCell>Waiter</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order: OrderSummary) => (
                            <TableRow key={order.id} hover>
                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                <TableCell>{order.tableId ?? "—"}</TableCell>
                                <TableCell>{order.servedByUserName ?? "—"}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.status}
                                        color={statusColors[order.status] ?? "default"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {formatCurrency(order.totalAmount)}
                                </TableCell>
                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleViewOrder(order.id)}
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={total}
                page={page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50]}
            />
        </Box>
    );
}
