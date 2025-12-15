import { Box, CircularProgress } from "@mui/material";
import type React from "react";
import { Sidebar } from "@/components/layouts/side-bar";
import { sidebarSections } from "@/constants";
import { useScopes } from "@/queries/scopes";
import { filterSectionsByScopes } from "@/utils/sidebar-filter";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { data: scopes, isLoading } = useScopes();

  // Extract scope names from the scopes response
  const scopeNames = scopes?.map((scope) => scope.name) || [];

  // Filter sections based on user scopes
  const filteredSections = filterSectionsByScopes(sidebarSections, scopeNames);

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
      <Sidebar sidebarSections={filteredSections} />
      <Box sx={{ flexGrow: 1, minWidth: 0, padding: 5 }}>{children}</Box>
    </Box>
  );
};

export { MainLayout };
