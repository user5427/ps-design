import { Box, Alert, Typography } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import type { ApplicableDiscountResponse } from "@ps-design/schemas/discount";
import { formatPrice } from "@/utils/price";

interface DiscountSectionProps {
    discount: ApplicableDiscountResponse | null | undefined;
    isLoading?: boolean;
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({
    discount,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Discount
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Checking for discounts...
                </Typography>
            </Box>
        );
    }

    if (!discount) {
        return null;
    }

    const discountDescription =
        discount.type === "PERCENTAGE"
            ? `${discount.value}% off`
            : `${formatPrice(discount.value)} off`;

    return (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Applied Discount
            </Typography>
            <Alert
                severity="info"
                icon={<LocalOfferIcon fontSize="inherit" />}
                sx={{ mt: 1 }}
            >
                <strong>{discount.name}</strong> — {discountDescription}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Saving: {formatPrice(discount.calculatedAmount)}
                </Typography>
            </Alert>
        </Box>
    );
};
