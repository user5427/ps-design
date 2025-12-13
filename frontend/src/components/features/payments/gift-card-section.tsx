import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import { formatPrice } from "@/utils/price";

interface GiftCardSectionProps {
  giftCardCode: string;
  onGiftCardCodeChange: (code: string) => void;
  validatedGiftCard: GiftCardResponse | null;
  giftCardError: string;
  onValidate: () => void;
  onClear: () => void;
  isValidating: boolean;
}

export const GiftCardSection: React.FC<GiftCardSectionProps> = ({
  giftCardCode,
  onGiftCardCodeChange,
  validatedGiftCard,
  giftCardError,
  onValidate,
  onClear,
  isValidating,
}) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Gift Card (Optional)
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <TextField
        value={giftCardCode}
        onChange={(e) => onGiftCardCodeChange(e.target.value)}
        placeholder="Enter code"
        fullWidth
        size="small"
        disabled={!!validatedGiftCard}
        slotProps={{
          input: {
            endAdornment: validatedGiftCard && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={onClear}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {!validatedGiftCard && (
        <Button
          variant="outlined"
          onClick={onValidate}
          disabled={!giftCardCode.trim() || isValidating}
        >
          {isValidating ? "..." : "Apply"}
        </Button>
      )}
    </Box>
    {giftCardError && (
      <Alert severity="error" sx={{ mt: 1 }}>
        {giftCardError}
      </Alert>
    )}
    {validatedGiftCard && (
      <Alert
        severity="success"
        icon={<CheckCircleIcon fontSize="inherit" />}
        sx={{ mt: 1 }}
      >
        Gift card applied: {formatPrice(validatedGiftCard.value)} discount
      </Alert>
    )}
  </Box>
);
