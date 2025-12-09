import { Drawer, useTheme } from "@mui/material";
import { SidebarContent } from "./side-bar-content";
import type { Section } from "./side-bar-item";

const DRAWER_WIDTH = 240;

interface SidebarProps {
  sidebarSections: Section[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarSections }) => {
  const theme = useTheme();
  const appBarHeight = (theme.mixins.toolbar.minHeight as number) + 10

  return (
    <Drawer
      aria-label="Navigation sidebar"
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          marginTop: `${appBarHeight}px`,
        },
      }}
    >
      <SidebarContent sections={sidebarSections} />
    </Drawer>
  );
};
