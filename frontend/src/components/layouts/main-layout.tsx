import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layouts/side-bar";
import { sidebarSections } from "@/constants";
import { useScopes } from "@/queries/scopes";
import { filterSectionsByScopes } from "@/utils/sidebar-filter";
import { useSettingsStore } from "@/store/settings";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { data: scopes, isLoading } = useScopes();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);

  const {
    visibleSections,
    initializeSections,
    sidebarPreference,
    setSidebarPreference,
  } = useSettingsStore();

  // Extract scope names from the scopes response
  const scopeNames = scopes?.map((scope) => scope.name) || [];

  // Filter sections based on user scopes
  const scopeFilteredSections = filterSectionsByScopes(
    sidebarSections,
    scopeNames,
  );

  // Initialize visibility settings for all sections
  useEffect(() => {
    const sectionLabels = sidebarSections.map((s) => s.label);
    initializeSections(sectionLabels);
  }, [initializeSections]);

  // Further filter by user visibility preferences
  const filteredSections = scopeFilteredSections.filter(
    (section) => visibleSections[section.label] !== false,
  );

  const isSidebarOpen = isDesktop
    ? sidebarPreference === "open"
    : isMobileSidebarOpen;

  const handleToggleSidebar = () => {
    if (isDesktop) {
      const next = isSidebarOpen ? "closed" : "open";
      setSidebarPreference(next);
    } else {
      setIsMobileSidebarOpen((prev) => !prev);
    }
  };

  const handleCloseSidebar = () => {
    if (isDesktop) {
      if (sidebarPreference !== "closed") {
        setSidebarPreference("closed");
      }
    } else {
      setIsMobileSidebarOpen(false);
    }

    // Optionally restore focus to the toggle button for accessibility
    // but do not leave it visually highlighted as "active".
    if (openButtonRef.current) {
      openButtonRef.current.blur();
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      <Sidebar
        sidebarSections={filteredSections}
        open={isSidebarOpen}
        variant={isDesktop ? "permanent" : "temporary"}
        onClose={handleCloseSidebar}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            pt: 1,
          }}
        >
          <Tooltip title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
            <IconButton
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              edge="start"
              onClick={handleToggleSidebar}
              ref={openButtonRef}
              size="small"
              sx={{
                transition: (theme) =>
                  theme.transitions.create("transform", {
                    duration: theme.transitions.duration.short,
                    easing: theme.transitions.easing.easeInOut,
                  }),
                transform: isSidebarOpen
                  ? "translateX(0) rotate(180deg)"
                  : "translateX(-240px) rotate(0deg)",
              }}
            >
              {isSidebarOpen ? (
                <ChevronLeftIcon fontSize="small" />
              ) : (
                <MenuIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ padding: 5, pt: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export { MainLayout };
