import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { SidebarContent } from "./side-bar-content";
import type { Section } from "./side-bar-item";

const DRAWER_WIDTH = 240;

interface SidebarProps {
  sidebarSections: Section[];
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarSections,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const appBarHeight = (theme.mixins.toolbar.minHeight as number) + 10;

  return (
    <Drawer
      aria-label="Navigation sidebar"
      variant="permanent"
      open
      onClose={onClose}
      transitionDuration={reduceMotion ? 0 : undefined}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          marginTop: `${appBarHeight}px`,
          transform: !open ? "translateX(-100%)" : "none",
          transition: reduceMotion
            ? undefined
            : theme.transitions.create("transform", {
                duration: theme.transitions.duration.standard,
                easing: theme.transitions.easing.easeInOut,
              }),
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      <SidebarContent sections={sidebarSections} />
    </Drawer>
  );
};
