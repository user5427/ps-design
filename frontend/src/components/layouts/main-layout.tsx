import { Box, Container } from "@mui/material";
import { Sidebar } from "@/components/layouts/side-bar";
import type React from "react";
import { sidebarSections } from "@/constants";

export interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Box>
            <Sidebar sidebarSections={sidebarSections} />
                <Container maxWidth="lg" sx={{ pt: 4, pb: 4}}>
                    {children}
                </Container>
        </Box>
    );
};

export { MainLayout };
