import { Box } from "@mui/material";
import type React from "react";

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
};
