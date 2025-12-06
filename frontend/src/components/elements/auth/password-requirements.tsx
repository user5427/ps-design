import { Box, Typography } from "@mui/material";
import type React from "react";

interface PasswordRequirementsProps {
  feedback: string[];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  feedback,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    Password does not meet requirements:
    {feedback.map((message: string) => (
      <Typography key={message} variant="caption">
        • {message}
      </Typography>
    ))}
  </Box>
);
