import { Box, TextField, InputAdornment, Typography } from "@mui/material";

interface TipSectionProps {
  tipAmount: string;
  onTipChange: (value: string) => void;
}

export const TipSection: React.FC<TipSectionProps> = ({
  tipAmount,
  onTipChange,
}) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Add Tip (Optional)
    </Typography>
    <TextField
      value={tipAmount}
      onChange={(e) => onTipChange(e.target.value)}
      placeholder="0.00"
      fullWidth
      type="text"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">€</InputAdornment>,
        },
      }}
    />
  </Box>
);
