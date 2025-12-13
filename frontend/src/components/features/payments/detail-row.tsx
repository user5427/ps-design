import { Box, Typography } from "@mui/material";

interface DetailRowProps {
  label: string;
  value: string;
}

export const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight="medium">{value}</Typography>
  </Box>
);
