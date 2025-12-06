import { Container } from "@mui/material";
import type React from "react";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 4 }}>
        {children}
    </Container>
  );
};

export { MainLayout };
