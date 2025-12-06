import { Drawer, Toolbar } from "@mui/material";
import { AppBarData } from "@/constants";
import { SidebarContent } from "./sidebar-content";
import type { Section } from "./sidebar-item";

const DRAWER_WIDTH = 240;

interface SidebarProps {
  sidebarSections: Section[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarSections }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar sx={{ minHeight: `${AppBarData.size}px` }} />
      <SidebarContent sections={sidebarSections} />
    </Drawer>
  );
};
