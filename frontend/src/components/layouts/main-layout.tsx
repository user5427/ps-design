import { Box } from "@mui/material";
import type React from "react";
import { AppBarData,sidebarSections } from "@/constants";
import { AppBar } from ".";
import { Sidebar } from "@/components/shared/sidebar";

interface MainLayoutProps {
  children?: React.ReactNode;
  hideNavigation?: boolean;
}

const MainLayout = ({ children, hideNavigation = false }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex' }}>
    {!hideNavigation && <Sidebar sidebarSections={sidebarSections} />}
    {!hideNavigation && <AppBar {...AppBarData} />}
    <Box
      sx={{
        flex: 1,
            flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        height: "100%",
        width: "100%",
          bgcolor: "white",
          display: "flex",
          mt: hideNavigation ? 0 : `${AppBarData.size}px`,
      }}
      component="main"
    >
        {children}
    </Box>
    </Box>
  );
};

export { MainLayout };
