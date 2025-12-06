import { Box } from "@mui/material";
import type React from "react";
import { AppBarData } from "@/constants";
import { AppBar } from ".";

interface MainLayoutProps {
  children?: React.ReactNode;
  isBarHidden?: boolean;
}

const MainLayout = ({ children, isBarHidden = false }: MainLayoutProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        minWidth: "100vw",
        bgcolor: "#f5f5f5",
      }}
    >
      {!isBarHidden && <AppBar {...AppBarData} />}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export { MainLayout };
