import { Box } from "@mui/material";
import type React from "react";
import { AppBarData,sidebarSections } from "@/constants";
import { AppBar } from ".";
import { Sidebar } from "@/components/shared/sidebar";

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout = ({ children,}: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex' }}>
    <Sidebar sidebarSections={sidebarSections} />
    <AppBar {...AppBarData} />
    <Box
      sx={{
        flex: 1,
        height: "100%",
        width: "100%",
          bgcolor: "white",
          mt: `${AppBarData.size}px`,
      }}
      component="main"
    >
        {children}
    </Box>
    </Box>
  );
};

export { MainLayout };
