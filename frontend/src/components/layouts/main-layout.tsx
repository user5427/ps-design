import { Box } from "@mui/material";
import type React from "react";
import { Sidebar } from "@/components/layouts/side-bar";
import { sidebarSections } from "@/constants";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      <Sidebar sidebarSections={sidebarSections} />
      <Box sx={{ flexGrow: 1, minWidth: 0, padding: 5 }}>
        {children}
      </Box>
    </Box>
  );
};

export { MainLayout };
